#//Soul/app/(tabs)/translation/backend/feature_loader.py

#需要與模型訓練的特徵提取標準一致，未來可能更改
# feature_loader.py
import os
import cv2
import numpy as np
import mediapipe as mp
import torch
from skimage.metrics import structural_similarity as ssim
from torchvision import transforms

mp_holistic = mp.solutions.holistic
mp_hands = mp.solutions.hands

def draw_hand_skeleton(image, hand_landmarks):
    skeleton = np.zeros_like(image)
    if not hand_landmarks:
        return skeleton

    points = [
        (int(lm.x * image.shape[1]), int(lm.y * image.shape[0]))
        for lm in hand_landmarks.landmark
    ]
    for connection in mp_hands.HAND_CONNECTIONS:
        start_idx, end_idx = connection
        cv2.line(skeleton, points[start_idx], points[end_idx], (0, 0, 255), 1)
    for point in points:
        cv2.circle(skeleton, point, 1, (0, 0, 255), -1)
    return skeleton

def extract_frames(video_path, sample_rate=3, similarity_threshold=0.95):
    holistic = mp_holistic.Holistic(
        static_image_mode=False,
        model_complexity=1,
        refine_face_landmarks=False
    )

    cap = cv2.VideoCapture(video_path)
    prev_frame = None
    prev_feature_image = None
    frame_idx = 0
    feature_images = []

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx % sample_rate != 0:
            frame_idx += 1
            continue

        frame = cv2.resize(frame, (320, 240))
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        landmarks = holistic.process(frame_rgb)

        # Optical flow
        if prev_frame is not None:
            prev_gray = cv2.cvtColor(prev_frame, cv2.COLOR_BGR2GRAY)
            curr_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            prev_gray = cv2.GaussianBlur(prev_gray, (5, 5), 0)
            curr_gray = cv2.GaussianBlur(curr_gray, (5, 5), 0)
            flow = cv2.calcOpticalFlowFarneback(
                prev_gray, curr_gray, None,
                0.5, 3, 15, 3, 5, 1.1, 0
            )
            mag, ang = cv2.cartToPolar(flow[..., 0], flow[..., 1])
            mag[mag < 5.0] = 0
            hsv = np.zeros_like(frame)
            hsv[..., 0] = ang * 180 / np.pi / 2
            hsv[..., 1] = 255
            hsv[..., 2] = cv2.normalize(mag, None, 0, 255, cv2.NORM_MINMAX)
            optical_flow = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
        else:
            optical_flow = np.zeros_like(frame)

        prev_frame = frame.copy()

        # Face + Hands
        left_hand = draw_hand_skeleton(frame, landmarks.left_hand_landmarks)
        right_hand = draw_hand_skeleton(frame, landmarks.right_hand_landmarks)
        hand_skeleton = cv2.add(left_hand, right_hand)

        face_feature = np.zeros_like(frame)
        if landmarks.face_landmarks:
            for lm in landmarks.face_landmarks.landmark:
                x, y = int(lm.x * frame.shape[1]), int(lm.y * frame.shape[0])
                cv2.circle(face_feature, (x, y), 1, (255, 255, 255), -1)

        synthesized = cv2.merge([
            face_feature[:, :, 0],
            optical_flow[:, :, 1],
            hand_skeleton[:, :, 2],
        ])

        # 跳過重複 frame
        if prev_feature_image is not None:
            gray_prev = cv2.cvtColor(prev_feature_image, cv2.COLOR_BGR2GRAY)
            gray_curr = cv2.cvtColor(synthesized, cv2.COLOR_BGR2GRAY)
            similarity = ssim(gray_prev, gray_curr)
            if similarity >= similarity_threshold:
                frame_idx += 1
                continue

        prev_feature_image = synthesized.copy()
        feature_images.append(synthesized)
        frame_idx += 1

    cap.release()
    holistic.close()

    # (T, 3, 224, 224)
    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Resize((224, 224)),
    ])
    frames_tensor = torch.stack([transform(img) for img in feature_images])
    return frames_tensor
