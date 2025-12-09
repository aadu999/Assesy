def solution(ip):
  # Your code here
  pass
if __name__ == "__main__":
    test_cases = [
    {
        "input": [
            "192.168.0.1"
        ],
        "output": true
    },
    {
        "input": [
            "255.255.255.255"
        ],
        "output": true
    },
    {
        "input": [
            "192.168.0"
        ],
        "output": false
    },
    {
        "input": [
            "192.168.0.1.1"
        ],
        "output": false
    },
    {
        "input": [
            "1234.1234.1234.1234"
        ],
        "output": false
    }
]
    passed = 0
    print("\n--- Running 5 Test Cases ---")
    for i, tc in enumerate(test_cases):
        try:
            result = solution(*tc["input"])
            if result == tc["output"]:
                print(f"Test {i+1}: PASS ✓")
                passed += 1
            else:
                print(f"Test {i+1}: FAIL ✗ (Expected {tc['output']}, Got {result})")
        except Exception as e:
            print(f"Test {i+1}: ERROR - {e}")
    print(f"\nTotal: {passed}/{len(test_cases)} passed")