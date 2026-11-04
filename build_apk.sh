#!/usr/bin/env bash
set -e

echo "=== Building Flappy Bird 3D Android APK ==="

PROJECT_DIR="/home/khushant/Flappy Bird"
SDK_DIR="$PROJECT_DIR/android-sdk"
BUILD_TOOLS="$SDK_DIR/build-tools/34.0.0"
PLATFORM="$SDK_DIR/platforms/android-34/android.jar"
JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"

AAPT2="$BUILD_TOOLS/aapt2"
D8="$BUILD_TOOLS/d8"
ZIPALIGN="$BUILD_TOOLS/zipalign"
APKSIGNER="$BUILD_TOOLS/apksigner"
JAVAC="$JAVA_HOME/bin/javac"
KEYTOOL="$JAVA_HOME/bin/keytool"

SRC_DIR="$PROJECT_DIR/android/app/src/main"
OUT_DIR="$PROJECT_DIR/build_output"
BUILD_TMP="/tmp/flappy_build_$(date +%s)"

mkdir -p "$OUT_DIR"
mkdir -p "$BUILD_TMP/res_compiled"
mkdir -p "$BUILD_TMP/gen"
mkdir -p "$BUILD_TMP/obj"
mkdir -p "$BUILD_TMP/dex"

# Sync assets from game/ to android assets
echo "1. Syncing latest game web assets..."
mkdir -p "$SRC_DIR/assets"
cp -r "$PROJECT_DIR/game/"* "$SRC_DIR/assets/"

# Step 1: Compile resources with aapt2
echo "2. Compiling Android resources with aapt2..."
"$AAPT2" compile --dir "$SRC_DIR/res" -o "$BUILD_TMP/res_compiled.zip"

# Step 2: Link resources and assets to produce R.java and initial base APK
echo "3. Linking resources and packaging assets..."
"$AAPT2" link -I "$PLATFORM" \
    --manifest "$SRC_DIR/AndroidManifest.xml" \
    "$BUILD_TMP/res_compiled.zip" \
    -A "$SRC_DIR/assets" \
    --java "$BUILD_TMP/gen" \
    -o "$BUILD_TMP/base.apk" \
    --auto-add-overlay

# Step 3: Compile Java sources
echo "4. Compiling Java sources with javac..."
"$JAVAC" -encoding UTF-8 -source 1.8 -target 1.8 \
    -bootclasspath "$PLATFORM" \
    -cp "$PLATFORM" \
    -d "$BUILD_TMP/obj" \
    "$BUILD_TMP/gen/com/flappybird3d/game/R.java" \
    "$SRC_DIR/java/com/flappybird3d/game/MainActivity.java"

# Step 4: Convert classes to Dalvik executable (dex)
echo "5. Generating classes.dex with d8..."
CLASS_FILES=$(find "$BUILD_TMP/obj" -name "*.class")
"$D8" --classpath "$PLATFORM" --min-api 21 --output "$BUILD_TMP/dex" $CLASS_FILES

# Step 5: Add classes.dex to base.apk
echo "6. Adding classes.dex to APK..."
cd "$BUILD_TMP/dex"
zip -u -j "$BUILD_TMP/base.apk" classes.dex
cd "$PROJECT_DIR"

# Step 6: 4-byte zipalign
echo "7. Aligning APK with zipalign..."
"$ZIPALIGN" -f -p 4 "$BUILD_TMP/base.apk" "$BUILD_TMP/aligned.apk"

# Step 7: Generate debug keystore if not exists
KEYSTORE="$OUT_DIR/debug.keystore"
if [ ! -f "$KEYSTORE" ]; then
    echo "8. Generating debug signing key..."
    "$KEYTOOL" -genkeypair -v \
        -keystore "$KEYSTORE" \
        -alias androiddebugkey \
        -keypass android \
        -storepass android \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -dname "CN=FlappyBird3D, OU=Game, O=Arcade, L=City, S=State, C=US"
fi

# Step 8: Sign APK with apksigner (v1, v2, v3, v4 schemes)
FINAL_APK="$PROJECT_DIR/FlappyBird3D.apk"
echo "9. Signing APK with apksigner..."
"$APKSIGNER" sign \
    --ks "$KEYSTORE" \
    --ks-pass pass:android \
    --key-pass pass:android \
    --ks-key-alias androiddebugkey \
    --out "$FINAL_APK" \
    "$BUILD_TMP/aligned.apk"

# Step 9: Verify signature
echo "10. Verifying APK signature..."
"$APKSIGNER" verify --verbose "$FINAL_APK"

# Cleanup tmp
rm -rf "$BUILD_TMP"

echo "================================================="
echo " SUCCESS! APK BUILT:"
ls -lh "$FINAL_APK"
echo "================================================="
