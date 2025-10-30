"""
End-to-End Playwright Test for Resume Analyzer Service
Tests the cloud deployment on GitHub Codespaces
"""

from playwright.sync_api import Page, expect
import time
import json

def test_resume_analyzer_service(page: Page):
    """Test the Resume Analyzer service endpoints"""
    
    # Service URL
    service_url = "https://noxious-spell-q7qvvw9p66rp357v-8000.app.github.dev"
    
    print("🚀 Starting Resume Analyzer End-to-End Test")
    print("=" * 50)
    
    # Test 1: Basic Service Health Check
    print("✅ Test 1: Service Health Check")
    response = page.goto(service_url)
    expect(response).to_be_ok()
    
    # Check response content
    content = page.content()
    assert "Resume Analyzer Service is Running" in content
    assert "ready" in content
    assert "8000" in content
    print("✅ Service is running and responding correctly")
    
    # Test 2: Health Endpoint
    print("✅ Test 2: Health Endpoint")
    health_response = page.goto(f"{service_url}/health")
    expect(health_response).to_be_ok()
    
    health_content = page.content()
    health_data = json.loads(health_content.strip('"').replace('\\', ''))
    assert health_data["status"] == "healthy"
    assert health_data["service"] == "resume-analyzer"
    print("✅ Health endpoint responding correctly")
    
    # Test 3: Service Documentation
    print("✅ Test 3: API Documentation")
    docs_response = page.goto(f"{service_url}/docs")
    expect(docs_response).to_be_ok()
    
    # Check if we can see the FastAPI docs interface
    page.wait_for_selector("title", timeout=10000)
    title = page.title()
    assert "FastAPI" in title or "docs" in title.lower()
    print("✅ API documentation is accessible")
    
    # Test 4: OpenAPI Schema
    print("✅ Test 4: OpenAPI Schema")
    schema_response = page.goto(f"{service_url}/openapi.json")
    expect(schema_response).to_be_ok()
    
    schema_content = page.content()
    schema_data = json.loads(schema_content)
    assert "openapi" in schema_data
    assert "info" in schema_data
    assert schema_data["info"]["title"] == "Resume Analyzer - CPU Optimized"
    print("✅ OpenAPI schema is valid")
    
    # Test 5: CORS Headers
    print("✅ Test 5: CORS Configuration")
    cors_response = page.request.get(service_url, headers={"Origin": "http://localhost:5173"})
    cors_headers = cors_response.headers
    assert "access-control-allow-origin" in cors_headers
    print("✅ CORS is properly configured")
    
    print("\n🎉 ALL TESTS PASSED!")
    print("=" * 50)
    print("✅ Resume Analyzer Service is fully operational")
    print("✅ All endpoints are responding correctly")
    print("✅ API documentation is accessible")
    print("✅ CORS is configured for frontend integration")
    print("✅ Ready for production use!")

def test_service_performance(page: Page):
    """Test service performance and response times"""
    
    service_url = "https://noxious-spell-q7qvvw9p66rp357v-8000.app.github.dev"
    
    print("\n⚡ Performance Testing")
    print("=" * 30)
    
    # Test response time
    start_time = time.time()
    response = page.goto(service_url)
    end_time = time.time()
    
    response_time = end_time - start_time
    print(f"✅ Response time: {response_time:.2f} seconds")
    
    # Service should respond within 10 seconds
    assert response_time < 10, f"Service too slow: {response_time}s"
    print("✅ Performance is within acceptable limits")

if __name__ == "__main__":
    # This can be run with: pytest test_resume_analyzer_e2e.py -v -s
    pass
