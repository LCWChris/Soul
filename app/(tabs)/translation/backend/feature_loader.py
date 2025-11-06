# //Soul/app/(tabs)/translation/backend/feature_loader.py

import cv2
import numpy as np
import mediapipe as mp
from tensorflow.keras.preprocessing.sequence import pad_sequences
import math
import os

# --- (所有常數和 helper 函數定義保持不變) ---
MOUTH_IDX = list(range(61, 89)) + list(range(308, 325))
LEFT_EYE_IDX = list(range(33, 42)) + list(range(133, 144))
RIGHT_EYE_IDX = list(range(362, 373)) + list(range(382, 390)) + list(range(390, 399))
FACE_IDX = MOUTH_IDX + LEFT_EYE_IDX + RIGHT_EYE_IDX
POSE_IDX = [0, 11, 12, 13, 14, 15, 16] 
HAND_SPATIAL_DIM = 21 * 3 
FACE_SPATIAL_DIM = len(FACE_IDX) * 3 
POSE_SPATIAL_DIM = len(POSE_IDX) * 3 
TOTAL_SPATIAL_DIM = 426
TOTAL_DISPLACEMENT_DIM = 168 
POSE_DIMENSION = 594 
MAX_SEQ_LENGTH = 40  
HAND_DIM = HAND_SPATIAL_DIM
FACE_KEYPOINT_DIM = FACE_SPATIAL_DIM
IMAGE_WIDTH = 320
IMAGE_HEIGHT = 240
ZERO_DISPLACEMENT_PAD = np.array([0.0] * TOTAL_DISPLACEMENT_DIM) 

mp_holistic = mp.solutions.holistic
mp_hands = mp.solutions.hands 

def get_hand_points_list(landmarks):
    if landmarks is None: return [(0.0, 0.0)] * 21
    return [(lm.x, lm.y) for lm in landmarks.landmark]

def calculate_mp_displacement_features(current_hand_pts, prev_hand_pts):
    dx_dy = []
    for i in range(21):
        prev_x, prev_y = prev_hand_pts[i]
        curr_x, curr_y = current_hand_pts[i]
        dx_dy.extend([curr_x - prev_x, curr_y - prev_y])
    return np.array(dx_dy)

def extract_pose_landmarks(results):
    keypoints = []
    current_hand_pts_L, current_hand_pts_R = [(0.0, 0.0)] * 21, [(0.0, 0.0)] * 21
    
    for landmarks, hand_type in [(results.left_hand_landmarks, 'L'), (results.right_hand_landmarks, 'R')]:
        if landmarks:
            pts = [item for lm in landmarks.landmark for item in (lm.x, lm.y, lm.z)]
            hand_pts_list = [(lm.x, lm.y) for lm in landmarks.landmark]
            keypoints.extend(pts)
            if hand_type == 'L': current_hand_pts_L = hand_pts_list
            else: current_hand_pts_R = hand_pts_list
        else:
            keypoints.extend([0.0] * HAND_DIM) 
            current_hand_pts_L = [(0.0, 0.0)] * 21 if hand_type == 'L' else current_hand_pts_L
            current_hand_pts_R = [(0.0, 0.0)] * 21 if hand_type == 'R' else current_hand_pts_R
            
    if results.face_landmarks:
        face_points = [item for i in FACE_IDX for item in (results.face_landmarks.landmark[i].x, results.face_landmarks.landmark[i].y, results.face_landmarks.landmark[i].z)]
        keypoints.extend(face_points)
    else:
        keypoints.extend([0.0] * FACE_KEYPOINT_DIM)
        
    if results.pose_landmarks:
        pose_points = [item for i in POSE_IDX for item in (results.pose_landmarks.landmark[i].x, results.pose_landmarks.landmark[i].y, results.pose_landmarks.landmark[i].z)]
        keypoints.extend(pose_points)
    else:
        keypoints.extend([0.0] * POSE_SPATIAL_DIM)

    spatial_coords_raw = np.array(keypoints).flatten()
    if spatial_coords_raw.size != TOTAL_SPATIAL_DIM: return np.array([0.0] * TOTAL_SPATIAL_DIM), current_hand_pts_L, current_hand_pts_R
    
    return spatial_coords_raw, current_hand_pts_L, current_hand_pts_R

def normalize_landmarks(spatial_coords):
    if spatial_coords.size != TOTAL_SPATIAL_DIM: return spatial_coords 
    
    lh_raw = spatial_coords[:HAND_DIM].reshape(21, 3)
    rh_raw = spatial_coords[HAND_DIM:HAND_DIM*2].reshape(21, 3)
    face_raw = spatial_coords[HAND_DIM*2 : HAND_DIM*2 + FACE_KEYPOINT_DIM].reshape(len(FACE_IDX), 3)
    pose_raw = spatial_coords[HAND_DIM*2 + FACE_KEYPOINT_DIM:].reshape(len(POSE_IDX), 3)

    shoulder_left = pose_raw[1] 
    shoulder_right = pose_raw[2] 
    center_point = np.array([0.5, 0.5, 0.0])
    
    if np.all(shoulder_left != 0) and np.all(shoulder_right != 0):
        center_point = (shoulder_left + shoulder_right) / 2.0
    elif np.all(pose_raw[0] != 0):
        center_point = pose_raw[0]
    elif np.all(lh_raw[0] != 0):
         center_point = lh_raw[0]
        
    scale_factor = 1.0
    target_length = 0.15 
    if np.all(shoulder_left != 0) and np.all(shoulder_right != 0):
        reference_dist = np.linalg.norm(shoulder_right - shoulder_left)
        if reference_dist > 1e-4:
            scale_factor = target_length / reference_dist

    lh_norm = np.nan_to_num((lh_raw - center_point) * scale_factor)
    rh_norm = np.nan_to_num((rh_raw - center_point) * scale_factor)
    face_norm = np.nan_to_num((face_raw - center_point) * scale_factor)
    pose_norm = np.nan_to_num((pose_raw - center_point) * scale_factor)
    
    return np.concatenate([
        lh_norm.flatten(), rh_norm.flatten(),
        face_norm.flatten(), pose_norm.flatten()
    ])

def draw_hand_skeleton(image, hand_landmarks):
    # 此函數用於 min_pixel 檢查，無須繪圖，僅需檢查點位
    skeleton = np.zeros_like(image)
    if hand_landmarks is None: return skeleton
    h, w = image.shape[:2]
    points = [(int(lm.x * w), int(lm.y * h)) for lm in hand_landmarks.landmark]
    if mp.solutions.hands:
        for start_idx, end_idx in mp.solutions.hands.HAND_CONNECTIONS:
            cv2.line(skeleton, points[start_idx], points[end_idx], (0, 0, 255), 1)
    return skeleton

# ----------------------------------------------------
# 3. 核心功能: 提取特徵序列 (公開函數)
# ----------------------------------------------------

# 💥 函數名稱更改為 extract_feature_sequence
def extract_feature_sequence(video_path): 
    """
    對單一影片進行特徵提取，輸出填充後的序列 (MAX_SEQ_LENGTH, 594)。
    """
    pose_seq = []
    frame_idx = 0
    prev_frame = None
    prev_hand_pts_L = None
    prev_hand_pts_R = None
    
    lk_params = dict(winSize=(15, 15), maxLevel=2, criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 10, 0.03))
    min_skeleton_pixels = 50 
    sample_rate = 3 

    if POSE_DIMENSION != 594: return None

    # 確保在每個請求中創建並釋放 holistic 實例 (Notebook 流程)
    with mp_holistic.Holistic(static_image_mode=False, model_complexity=1) as holistic:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened(): return None
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret: break

            if frame_idx % sample_rate != 0:
                frame_idx += 1
                continue

            frame_resized = cv2.resize(frame, (IMAGE_WIDTH, IMAGE_HEIGHT)) 
            frame_rgb = cv2.cvtColor(frame_resized, cv2.COLOR_BGR2RGB)
            
            results = holistic.process(frame_rgb)
            
            spatial_coords_raw, current_hand_pts_L, current_hand_pts_R = extract_pose_landmarks(results)
            standardized_spatial_coords = normalize_landmarks(spatial_coords_raw)
            
            displacement_features = ZERO_DISPLACEMENT_PAD 
            if prev_hand_pts_L is not None and prev_hand_pts_R is not None and prev_frame is not None:
                # LK 光流和 MediaPipe 位移 (168 維)
                prev_gray = cv2.cvtColor(prev_frame, cv2.COLOR_BGR2GRAY)
                curr_gray = cv2.cvtColor(frame_resized, cv2.COLOR_BGR2GRAY)
                h_res, w_res = frame_resized.shape[:2]
                
                prev_pts_L_pix = np.array([[int(x * w_res), int(y * h_res)] for x, y in prev_hand_pts_L], dtype=np.float32).reshape(-1, 1, 2)
                prev_pts_R_pix = np.array([[int(x * w_res), int(y * h_res)] for x, y in prev_hand_pts_R], dtype=np.float32).reshape(-1, 1, 2)
                
                next_pts_L_pix, _, _ = cv2.calcOpticalFlowPyrLK(prev_gray, curr_gray, prev_pts_L_pix, None, **lk_params)
                next_pts_R_pix, _, _ = cv2.calcOpticalFlowPyrLK(prev_gray, curr_gray, prev_pts_R_pix, None, **lk_params)
                
                dx_L = (next_pts_L_pix[:, 0, 0] - prev_pts_L_pix[:, 0, 0]) / w_res 
                dy_L = (next_pts_L_pix[:, 0, 1] - prev_pts_L_pix[:, 0, 1]) / h_res
                dx_R = (next_pts_R_pix[:, 0, 0] - prev_pts_R_pix[:, 0, 0]) / w_res
                dy_R = (next_pts_R_pix[:, 0, 1] - prev_pts_L_pix[:, 0, 1]) / h_res
                lk_displacement_features = np.concatenate([dx_L, dy_L, dx_R, dy_R])
                
                mp_disp_L = calculate_mp_displacement_features(current_hand_pts_L, prev_hand_pts_L)
                mp_disp_R = calculate_mp_displacement_features(current_hand_pts_R, prev_hand_pts_R)
                mp_displacement_features = np.concatenate([mp_disp_L, mp_disp_R])
                displacement_features = np.concatenate([lk_displacement_features, mp_displacement_features])

            final_pose_vector = np.concatenate([standardized_spatial_coords, displacement_features])
            
            if final_pose_vector.shape[0] != POSE_DIMENSION:
                 frame_idx += 1
                 continue
            
            # (min_pixel 檢查)
            if not results.left_hand_landmarks and not results.right_hand_landmarks:
                frame_idx += 1
                prev_frame = frame_resized.copy()
                prev_hand_pts_L = current_hand_pts_L
                prev_hand_pts_R = current_hand_pts_R
                continue
            
            prev_frame = frame_resized.copy()
            prev_hand_pts_L = current_hand_pts_L
            prev_hand_pts_R = current_hand_pts_R
            
            pose_seq.append(final_pose_vector) 
            frame_idx += 1

        cap.release()
    
    if not pose_seq:
        return None

    padded_features = pad_sequences([np.array(pose_seq)], maxlen=MAX_SEQ_LENGTH, padding='post', dtype='float32')
    return padded_features[0]