#!/usr/bin/env bash
set -e

echo "=== Building Flappy Bird 3D Android TV APK ==="

TV_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$TV_DIR/.." && pwd)"
SDK_DIR="$ROOT_DIR/android-sdk"
BUILD_TOOLS="$SDK_DIR/build-tools/34.0.0"
PLATFORM="$SDK_DIR/platforms/android-34/android.jar"
JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/java-17-openjdk-amd64}"

AAPT2="$BUILD_TOOLS/aapt2"
D8="$BUILD_TOOLS/d8"
ZIPALIGN="$BUILD_TOOLS/zipalign"
APKSIGNER="$BUILD_TOOLS/apksigner"
JAVAC="$JAVA_HOME/bin/javac"
KEYTOOL="$JAVA_HOME/bin/keytool"

SRC_DIR="$TV_DIR/android/app/src/main"
OUT_DIR="$TV_DIR/build_output"
KEYSTORE="$ROOT_DIR/build_output/debug.keystore"
BUILD_TMP="/tmp/flappy_tv_build_$(date +%s)"

mkdir -p "$OUT_DIR"
mkdir -p "$BUILD_TMP/res_compiled"
mkdir -p "$BUILD_TMP/gen"
mkdir -p "$BUILD_TMP/obj"
mkdir -p "$BUILD_TMP/dex"

# Sync assets from game/ to android assets
echo "1. Syncing latest game web assets for TV..."
mkdir -p "$SRC_DIR/assets"
cp -r "$TV_DIR/game/"* "$SRC_DIR/assets/"

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
    $(find "$SRC_DIR/java" "$BUILD_TMP/gen" -name "*.java")

# Step 4: Convert Java bytecode to Dalvik Executable (classes.dex) with d8
echo "5. Generating classes.dex with d8..."
"$D8" --release --min-api 21 \
    --lib "$PLATFORM" \
    --output "$BUILD_TMP/dex" \
    $(find "$BUILD_TMP/obj" -name "*.class")

# Step 5: Add classes.dex into base APK
echo "6. Adding classes.dex to APK..."
cd "$BUILD_TMP/dex"
zip -u "$BUILD_TMP/base.apk" classes.dex
cd "$TV_DIR"

# Step 6: Ensure keystore exists
if [ ! -f "$KEYSTORE" ]; then
    echo "Creating debug keystore..."
    mkdir -p "$(dirname "$KEYSTORE")"
    "$KEYTOOL" -genkey -v -keystore "$KEYSTORE" \
        -alias androiddebugkey -storepass android -keypass android \
        -keyalg RSA -keysize 2048 -validity 10000 \
        -dname "CN=Android Debug,O=Android,C=US"
fi

# Step 7: Align APK with zipalign (4-byte boundary)
echo "7. Aligning APK with zipalign..."
rm -f "$BUILD_TMP/unaligned.apk" "$TV_DIR/FlappyBird3D-TV.apk"
cp "$BUILD_TMP/base.apk" "$BUILD_TMP/unaligned.apk"
"$ZIPALIGN" -f 4 "$BUILD_TMP/unaligned.apk" "$TV_DIR/FlappyBird3D-TV.apk"

# Step 8: Sign APK with apksigner (v1, v2, v3 signature schemes)
echo "8. Signing APK with apksigner..."
"$APKSIGNER" sign --ks "$KEYSTORE" \
    --ks-key-alias androiddebugkey \
    --ks-pass pass:android \
    --key-pass pass:android \
    --v1-signing-enabled true \
    --v2-signing-enabled true \
    --v3-signing-enabled true \
    "$TV_DIR/FlappyBird3D-TV.apk"

# Step 9: Verify APK signature
echo "9. Verifying APK signature..."
"$APKSIGNER" verify --verbose "$TV_DIR/FlappyBird3D-TV.apk"

# Clean temporary build files
rm -rf "$BUILD_TMP"

echo "================================================="
echo " SUCCESS! TV APK BUILT:"
ls -lh "$TV_DIR/FlappyBird3D-TV.apk"
echo "================================================="
