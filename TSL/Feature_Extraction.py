import os
import cv2
import numpy as np
import mediapipe as mp
from skimage.metrics import structural_similarity as ssim

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


def extract_features_from_video(video_path, output_dir, gloss, split,
                                sample_rate=3, similarity_threshold=0.95):
    os.makedirs(output_dir, exist_ok=True)

    holistic = mp_holistic.Holistic(
        static_image_mode=False,
        model_complexity=1,
        refine_face_landmarks=False
    )

    cap = cv2.VideoCapture(video_path)
    frame_idx, saved_count, skipped_count = 0, 0, 0
    prev_frame = None
    prev_feature_image = None

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

        if prev_frame is not None:
            prev_gray = cv2.cvtColor(prev_frame, cv2.COLOR_BGR2GRAY)
            curr_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            prev_gray = cv2.GaussianBlur(prev_gray, (5, 5), 0)
            curr_gray = cv2.GaussianBlur(curr_gray, (5, 5), 0)

            flow = cv2.calcOpticalFlowFarneback(
                prev_gray, curr_gray, None,
                pyr_scale=0.5,
                levels=3,
                winsize=15,
                iterations=3,
                poly_n=5,
                poly_sigma=1.1,
                flags=0
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
            hand_skeleton[:, :, 2]
        ])

        if prev_feature_image is not None:
            gray_prev = cv2.cvtColor(prev_feature_image, cv2.COLOR_BGR2GRAY)
            gray_curr = cv2.cvtColor(synthesized, cv2.COLOR_BGR2GRAY)
            similarity_score = ssim(gray_prev, gray_curr)

            if similarity_score >= similarity_threshold:
                skipped_count += 1
                frame_idx += 1
                continue  # 相似度過高跳過

        prev_feature_image = synthesized.copy()

        save_path = os.path.join(output_dir, f"frame_{saved_count:04d}.png")
        cv2.imwrite(save_path, synthesized)
        saved_count += 1

        frame_idx += 1

    cap.release()
    holistic.close()

    print(f"[{split} | {gloss}] {os.path.basename(video_path)}："
          f"已儲存 {saved_count} 幀，跳過 {skipped_count} 幀")
    return saved_count


def batch_process_dataset(video_root, output_root):
    splits = ['train', 'val', 'test']
    total_videos = 0

    for split in splits:
        split_dir = os.path.join(video_root, split)
        if not os.path.exists(split_dir):
            continue

        for gloss in sorted(os.listdir(split_dir)):
            gloss_dir = os.path.join(split_dir, gloss)
            if not os.path.isdir(gloss_dir):
                continue

            print(f"\n正在處理詞彙：【{gloss}】| 資料集類型：【{split}】")

            for video_file in sorted(os.listdir(gloss_dir)):
                if not video_file.endswith('.mp4'):
                    continue

                video_path = os.path.join(gloss_dir, video_file)
                video_id = os.path.splitext(video_file)[0]
                output_dir = os.path.join(output_root, split, gloss, video_id)

                extract_features_from_video(
                    video_path, output_dir, gloss, split
                )
                total_videos += 1

    print(f"\n已完成處理 {total_videos} 部影片！特徵圖已保存至 {output_root}")


if __name__ == "__main__":
    video_root = "./main"
    output_root = "./wlasl_features"
    batch_process_dataset(video_root, output_root)
