# Android APK Build Workflow Guide

This project includes an automated **GitHub Actions Workflow** (`.github/workflows/build-apk.yml`) that compiles the web application and packages it into a native Android `.apk` file using **Capacitor**.

---

## 🚀 How to Build & Download the APK

### Method 1: Manual One-Click Trigger (Recommended)
1. Go to your repository on **GitHub**.
2. Click on the **Actions** tab at the top.
3. In the left sidebar, click on **Build Android APK**.
4. Click the **Run workflow** dropdown button on the right.
5. Select the branch (e.g., `main`), choose **debug** or **release**, and click **Run workflow**.
6. When the job completes (typically ~3–4 minutes), click on the completed run.
7. Scroll down to the **Artifacts** section at the bottom of the summary page and download:
   - `QiblaAndSholatByFF-debug-apk.zip`
8. Unzip the downloaded file to get your `QiblaAndSholatByFF-debug.apk` file!

### Method 2: Automatic Trigger on Code Push
Every time code is pushed to `main` or `master`, the workflow automatically builds a fresh APK.

### Method 3: Release Creation on Version Tag
When you create and push a git tag like `v1.0.0`:
```bash
git tag v1.0.0
git push origin v1.0.0
```
The workflow will automatically create a new **GitHub Release** and attach the compiled APK directly to the release page.

---

## 📱 How to Install the APK on Your Android Device
1. Transfer the `.apk` file to your Android phone (via Google Drive, USB, WhatsApp, or downloading directly from GitHub in your phone's browser).
2. Tap on the `.apk` file in your phone's File Manager or Downloads.
3. If prompted with *"For your security, your phone is not allowed to install unknown apps from this source"*, tap **Settings** and toggle **Allow from this source**.
4. Tap **Install**.
5. Open **Qibla and Sholat by FF** and grant Geolocation and Notification permissions when prompted.

---

## 🛠 Local APK Building (Optional)
If you want to build locally on your development computer (requires **Java 21** / JDK 21 and Android Studio):
```bash
# 1. Install dependencies
npm install

# 2. Build web bundle
npm run build

# 3. Add & sync Android native project
npx cap add android
npx cap sync android

# 4. Open in Android Studio
npx cap open android
```
In Android Studio: Ensure Gradle JDK is set to **Java 21**, then go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
