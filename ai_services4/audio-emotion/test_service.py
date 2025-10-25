import requests
import sys

def test_service(audio_file_path: str, base_url: str = "http://localhost:8001"):
    """Test the audio emotion analysis service"""
    
    print(f"Testing Audio Emotion Analysis Service at {base_url}")
    print("=" * 60)
    
    # Test 1: Root endpoint
    print("\n1. Testing root endpoint...")
    try:
        response = requests.get(f"{base_url}/")
        print(f"✅ Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: Health check
    print("\n2. Testing health check...")
    try:
        response = requests.get(f"{base_url}/health")
        print(f"✅ Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 3: Supported emotions
    print("\n3. Testing supported emotions...")
    try:
        response = requests.get(f"{base_url}/supported-emotions")
        print(f"✅ Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 4: Audio analysis
    print("\n4. Testing audio analysis...")
    if audio_file_path:
        try:
            with open(audio_file_path, 'rb') as f:
                files = {'file': (audio_file_path, f, 'audio/wav')}
                response = requests.post(f"{base_url}/analyze-audio", files=files)
            
            print(f"✅ Status: {response.status_code}")
            if response.status_code == 200:
                result = response.json()
                print(f"\nEmotion Analysis Results:")
                print(f"  Detected Emotion: {result['emotion']}")
                print(f"  Confidence: {result['confidence']:.2%}")
                print(f"  Duration: {result['duration']:.2f}s")
                print(f"\n  All Scores:")
                for emotion, score in sorted(result['all_scores'].items(), key=lambda x: x[1], reverse=True):
                    print(f"    {emotion}: {score:.2%}")
            else:
                print(f"Response: {response.json()}")
        except FileNotFoundError:
            print(f"❌ Audio file not found: {audio_file_path}")
        except Exception as e:
            print(f"❌ Error: {e}")
    else:
        print("⚠️  No audio file provided. Skipping audio analysis test.")
    
    # Add this test after Test 4
    # Test 5: Long audio analysis
    print("\n5. Testing long audio analysis with chunking...")
    if audio_file_path:
        try:
            with open(audio_file_path, 'rb') as f:
                files = {'file': (audio_file_path, f, 'audio/wav')}
                response = requests.post(
                    f"{base_url}/analyze-audio-long?remove_silence=true",
                    files=files
                )
            
            print(f"✅ Status: {response.status_code}")
            if response.status_code == 200:
                result = response.json()
                print(f"\nLong Audio Analysis Results:")
                print(f"  Dominant Emotion: {result['dominant_emotion']}")
                print(f"  Avg Confidence: {result['avg_confidence']:.2%}")
                print(f"  Total Duration: {result['total_duration']:.2f}s")
                print(f"  Number of Chunks: {result['num_chunks']}")
                print(f"\n  Emotion Distribution:")
                for emotion, pct in result['emotion_distribution'].items():
                    print(f"    {emotion}: {pct:.1f}%")
            else:
                print(f"Response: {response.json()}")
        except Exception as e:
            print(f"❌ Error: {e}")
    else:
        print("⚠️  No audio file provided. Skipping long audio analysis test.")
    
    print("\n" + "=" * 60)
    print("Testing complete!")

if __name__ == "__main__":
    audio_path = sys.argv[1] if len(sys.argv) > 1 else None
    test_service(audio_path)