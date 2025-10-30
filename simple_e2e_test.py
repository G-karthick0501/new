"""
Simple End-to-End Test for Resume Analyzer Service
Tests the cloud deployment on GitHub Codespaces using curl
"""

import subprocess
import json
import time
import sys

def run_command(command):
    """Run a command and return output"""
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=30)
        return result.stdout, result.stderr, result.returncode
    except subprocess.TimeoutExpired:
        return "", "Command timed out", 1

def test_resume_analyzer_service():
    """Test the Resume Analyzer service endpoints"""
    
    service_url = "https://noxious-spell-q7qvvw9p66rp357v-8000.app.github.dev"
    
    print("🚀 Starting Resume Analyzer End-to-End Test")
    print("=" * 50)
    
    # Test 1: Basic Service Health Check
    print("✅ Test 1: Service Health Check")
    stdout, stderr, code = run_command(f'curl -s -w "%{{http_code}}" "{service_url}"')
    
    if code == 0:
        # Extract HTTP code from the end of stdout
        http_code = stdout[-3:] if len(stdout) >= 3 else "000"
        response_body = stdout[:-3] if len(stdout) >= 3 else stdout
        
        print(f"HTTP Status: {http_code}")
        print(f"Response: {response_body}")
        
        if http_code == "200":
            assert "Resume Analyzer Service is Running" in response_body
            assert "ready" in response_body
            assert "8000" in response_body
            print("✅ Service is running and responding correctly")
        else:
            print(f"❌ Service returned HTTP {http_code}")
            return False
    else:
        print(f"❌ Command failed: {stderr}")
        return False
    
    # Test 2: Health Endpoint
    print("✅ Test 2: Health Endpoint")
    stdout, stderr, code = run_command(f'curl -s -w "%{{http_code}}" "{service_url}/health"')
    
    if code == 0:
        http_code = stdout[-3:] if len(stdout) >= 3 else "000"
        response_body = stdout[:-3] if len(stdout) >= 3 else stdout
        
        if http_code == "200":
            try:
                # Clean up the response and parse JSON
                clean_response = response_body.strip('"').replace('\\', '')
                health_data = json.loads(clean_response)
                assert health_data["status"] == "healthy"
                assert health_data["service"] == "resume-analyzer"
                print("✅ Health endpoint responding correctly")
            except json.JSONDecodeError:
                print(f"❌ Invalid JSON response: {response_body}")
                return False
        else:
            print(f"❌ Health endpoint returned HTTP {http_code}")
            return False
    else:
        print(f"❌ Health endpoint command failed: {stderr}")
        return False
    
    # Test 3: API Documentation
    print("✅ Test 3: API Documentation")
    stdout, stderr, code = run_command(f'curl -s -w "%{{http_code}}" "{service_url}/docs"')
    
    if code == 0:
        http_code = stdout[-3:] if len(stdout) >= 3 else "000"
        response_body = stdout[:-3] if len(stdout) >= 3 else stdout
        
        if http_code == "200":
            assert "FastAPI" in response_body or "swagger" in response_body.lower()
            print("✅ API documentation is accessible")
        else:
            print(f"❌ Docs endpoint returned HTTP {http_code}")
            return False
    else:
        print(f"❌ Docs endpoint command failed: {stderr}")
        return False
    
    # Test 4: OpenAPI Schema
    print("✅ Test 4: OpenAPI Schema")
    stdout, stderr, code = run_command(f'curl -s -w "%{{http_code}}" "{service_url}/openapi.json"')
    
    if code == 0:
        http_code = stdout[-3:] if len(stdout) >= 3 else "000"
        response_body = stdout[:-3] if len(stdout) >= 3 else stdout
        
        if http_code == "200":
            try:
                schema_data = json.loads(response_body)
                assert "openapi" in schema_data
                assert "info" in schema_data
                assert schema_data["info"]["title"] == "Resume Analyzer - CPU Optimized"
                print("✅ OpenAPI schema is valid")
            except json.JSONDecodeError:
                print(f"❌ Invalid JSON schema: {response_body}")
                return False
        else:
            print(f"❌ Schema endpoint returned HTTP {http_code}")
            return False
    else:
        print(f"❌ Schema endpoint command failed: {stderr}")
        return False
    
    # Test 5: Performance Test
    print("✅ Test 5: Performance Test")
    start_time = time.time()
    stdout, stderr, code = run_command(f'curl -s -w "%{{http_code}}" "{service_url}"')
    end_time = time.time()
    
    if code == 0:
        response_time = end_time - start_time
        print(f"✅ Response time: {response_time:.2f} seconds")
        
        if response_time < 10:
            print("✅ Performance is within acceptable limits")
        else:
            print(f"⚠️ Service is slow: {response_time:.2f}s")
    
    print("\n🎉 ALL TESTS PASSED!")
    print("=" * 50)
    print("✅ Resume Analyzer Service is fully operational")
    print("✅ All endpoints are responding correctly")
    print("✅ API documentation is accessible")
    print("✅ Ready for production use!")
    return True

if __name__ == "__main__":
    success = test_resume_analyzer_service()
    sys.exit(0 if success else 1)
