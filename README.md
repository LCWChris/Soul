# Welcome to your Expo app 👋

這是從頭開始的資料優，按照下面的指示操作~
This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## 現在把 Route 設定好了，規則如下:

/app ->這是頁面資料夾。

/(auth) ->這是註冊頁面。

/(tabs) ->這是導覽列，有四個導覽列。

由左到右分別是(home)、education、translation、user

- 每個資料夾中的 index.jsx 就是該導覽列的主頁，例如:

  - 按下 education 的 icon 後會跳轉

    ```bash
    /app/(tabs)/education/index.jsx
    ```

* 而該導覽列相關跳轉的內容都會在同一個資料夾，例如:
  - WordLearningPage.jsx 跟 educatioin 相關就要放在
    ```bash
    /app/(tabs)/education/
    ```

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
