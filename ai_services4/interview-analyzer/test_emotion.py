"""
Test script to verify emotion analysis setup
"""
import sys

print("🔍 Testing emotion analysis dependencies...\n")

# Test 1: Import checks
print("1️⃣ Testing imports...")
try:
    import cv2
    print("   ✅ opencv-python installed")
except ImportError as e:
    print(f"   ❌ opencv-python missing: {e}")
    sys.exit(1)

try:
    import numpy as np
    print("   ✅ numpy installed")
except ImportError as e:
    print(f"   ❌ numpy missing: {e}")
    sys.exit(1)

try:
    from deepface import DeepFace
    print("   ✅ deepface installed")
except ImportError as e:
    print(f"   ❌ deepface missing: {e}")
    print("   💡 Install with: pip install deepface")
    sys.exit(1)

try:
    import tensorflow as tf
    print(f"   ✅ tensorflow installed (version: {tf.__version__})")
except ImportError as e:
    print(f"   ❌ tensorflow missing: {e}")
    print("   💡 Install with: pip install tensorflow")
    sys.exit(1)

# Test 2: Create test image
print("\n2️⃣ Creating test image...")
try:
    # Create a simple test image (black square)
    test_image = np.zeros((480, 640, 3), dtype=np.uint8)
    # Add a white circle (simulating a face)
    cv2.circle(test_image, (320, 240), 100, (255, 255, 255), -1)
    print("   ✅ Test image created")
except Exception as e:
    print(f"   ❌ Failed to create test image: {e}")
    sys.exit(1)

# Test 3: Test DeepFace
print("\n3️⃣ Testing DeepFace emotion detection...")
try:
    print("   ⏳ Running DeepFace.analyze() (this may take a moment on first run)...")
    result = DeepFace.analyze(
        test_image,
        actions=['emotion'],
        enforce_detection=False,
        detector_backend='opencv'
    )
    print("   ✅ DeepFace analysis successful!")
    print(f"   📊 Result type: {type(result)}")
    if result:
        print(f"   📊 Emotions detected: {list(result[0]['emotion'].keys())}")
except Exception as e:
    print(f"   ❌ DeepFace analysis failed: {e}")
    import traceback
    print(f"   📋 Traceback:\n{traceback.format_exc()}")
    sys.exit(1)

# Test 4: Import emotion analyzer
print("\n4️⃣ Testing EmotionAnalyzer class...")
try:
    from models.emotion_analyzer import EmotionAnalyzer
    analyzer = EmotionAnalyzer()
    print("   ✅ EmotionAnalyzer initialized successfully")
except Exception as e:
    print(f"   ❌ Failed to initialize EmotionAnalyzer: {e}")
    import traceback
    print(f"   📋 Traceback:\n{traceback.format_exc()}")
    sys.exit(1)

print("\n✅ All tests passed! Emotion analysis is ready to use.")
print("\n💡 Next steps:")
print("   1. Start the server: uvicorn app:app --reload --port 8001")
print("   2. Check the frontend console for detailed logs")
print("   3. Ensure your camera is working and face is visible")
