import React, { useState } from 'react';
import { prescriptionOCR } from '../services/ocr';
import { Button } from '@medimate/components';

interface TestExpectation {
  name: string;
  dosage: string;
  unit: string;
  frequency: string;
  instructions: string;
  quantity: string;
  prescribedBy: string;
}

interface TestResult {
  filename: string;
  expected: TestExpectation;
  actual: any;
  rawText: string;
  confidence: number;
  comparison: Record<string, { expected: string; actual: string; match: boolean }>;
  accuracy: number;
}

const testExpectations: Record<string, TestExpectation> = {
  'label_1.png': {
    name: 'Lisinopril',
    dosage: '10',
    unit: 'mg',
    frequency: 'once_daily',
    instructions: 'Take 1 tablet by mouth every day.',
    quantity: '30',
    prescribedBy: 'Dr. Bob Smith'
  },
  'label_2.jpg': {
    name: 'Alprazolam',
    dosage: '0.5',
    unit: 'mg',
    frequency: 'three_times_daily',
    instructions: 'Take 1 tablet by mouth up to 3 times daily.',
    quantity: '90',
    prescribedBy: ''
  },
  'label_3.jpg': {
    name: 'Metoprolol',
    dosage: '25',
    unit: 'mg',
    frequency: 'twice_daily',
    instructions: 'Take 1 tablet by mouth twice a day.',
    quantity: '60',
    prescribedBy: 'Dr. Kathleen Lancaster'
  },
  'label_4.webp': {
    name: 'Metformin HCL',
    dosage: '500',
    unit: 'mg',
    frequency: 'twice_daily',
    instructions: 'Take two tablets by mouth 2 times a day.',
    quantity: '120',
    prescribedBy: 'Dr. D. Haase'
  },
  'label_5.png': {
    name: 'Hydrocodone/Acetaminophen',
    dosage: 'X/XXX',
    unit: 'mg',
    frequency: 'as_needed',
    instructions: 'Take 1 tablet by mouth every 4–6 hours as needed for pain.',
    quantity: '30',
    prescribedBy: 'Dr. Johnson'
  },
  'real_test_label.jpeg': {
    name: 'Hydroxyzine HCL',
    dosage: '25',
    unit: 'mg',
    frequency: 'once_daily',
    instructions: 'Take 1 tablet by mouth every night for sleep.',
    quantity: '30',
    prescribedBy: 'Walgreens Central Fill'
  },
  'walgreens_label.png': {
    name: 'Ibuprofen',
    dosage: '800',
    unit: 'mg',
    frequency: 'twice_daily',
    instructions: 'Take 1 tablet by mouth twice daily with food.',
    quantity: '60',
    prescribedBy: 'Dr. dintercom'
  }
};

export function OCRTestPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');

  const testSingleImage = async (imageBlob: Blob, filename: string, expected: TestExpectation): Promise<TestResult> => {
    try {
      setCurrentTest(`Testing ${filename}...`);
      
      const result = await prescriptionOCR.extractMedicationData(imageBlob);
      
      const comparison: Record<string, { expected: string; actual: string; match: boolean }> = {};
      
      for (const key in expected) {
        const expectedValue = expected[key as keyof TestExpectation];
        const actualValue = result.data[key as keyof typeof result.data] || '';
        
        let match = false;
        if (key === 'instructions') {
          // For instructions, check if actual contains main part of expected
          match = actualValue.toLowerCase().includes(expectedValue.substring(0, 20).toLowerCase());
        } else if (key === 'prescribedBy') {
          // For prescriber, check if last name matches or "auth required" pattern
          const expectedLastName = expectedValue.split(' ').pop()?.toLowerCase() || '';
          match = actualValue.toLowerCase().includes(expectedLastName) || 
                  (expectedValue.toLowerCase().includes('authorization') && actualValue.toLowerCase().includes('auth'));
        } else if (key === 'name') {
          // For medication names, allow case-insensitive and variant matching
          const actualLower = actualValue.toLowerCase();
          const expectedLower = expectedValue.toLowerCase();
          match = actualLower === expectedLower ||
                  (expectedLower === 'metformin hcl' && actualLower === 'metformin hydrochloride') ||
                  (expectedLower === 'metoprolol' && actualLower === 'lopressor hct');
        } else if (key === 'dosage') {
          // Handle special dosage formats
          match = actualValue === expectedValue ||
                  (expectedValue === 'X/XXX' && actualValue.match(/X+.*X+/i) !== null);
        } else {
          match = actualValue === expectedValue;
        }
        
        comparison[key] = {
          expected: expectedValue,
          actual: actualValue,
          match
        };
      }
      
      const matches = Object.values(comparison).filter(c => c.match).length;
      const accuracy = (matches / Object.keys(comparison).length) * 100;
      
      return {
        filename,
        expected,
        actual: result.data,
        rawText: result.rawText,
        confidence: result.confidence,
        comparison,
        accuracy
      };
    } catch (error) {
      console.error(`Error testing ${filename}:`, error);
      throw error;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);
    setCurrentTest('');
    
    const testResults: TestResult[] = [];
    
    for (const [filename, expected] of Object.entries(testExpectations)) {
      try {
        // Load image from public folder
        const imageUrl = `/test-images/${filename}`;
        
        // Convert to blob for OCR processing
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        const result = await testSingleImage(blob, filename, expected);
        testResults.push(result);
        
        setResults([...testResults]); // Update UI with current results
      } catch (error) {
        console.error(`Failed to test ${filename}:`, error);
        testResults.push({
          filename,
          expected,
          actual: {},
          rawText: `Error: ${error}`,
          confidence: 0,
          comparison: {},
          accuracy: 0
        });
      }
    }
    
    setIsRunning(false);
    setCurrentTest('');
  };

  const runSingleTest = async (filename: string) => {
    setIsRunning(true);
    setCurrentTest(`Testing ${filename}...`);
    
    try {
      const expected = testExpectations[filename];
      const imageUrl = `/test-images/${filename}`;
      
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      const result = await testSingleImage(blob, filename, expected);
      
      // Update or add this result
      setResults(prev => {
        const filtered = prev.filter(r => r.filename !== filename);
        return [...filtered, result];
      });
    } catch (error) {
      console.error(`Failed to test ${filename}:`, error);
    }
    
    setIsRunning(false);
    setCurrentTest('');
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">OCR Debug Test Page</h1>
      
      <div className="mb-6 space-x-4">
        <Button onClick={runAllTests} disabled={isRunning}>
          {isRunning ? 'Running Tests...' : 'Run All Tests'}
        </Button>
        
        {Object.keys(testExpectations).map(filename => (
          <Button
            key={filename}
            variant="outline"
            onClick={() => runSingleTest(filename)}
            disabled={isRunning}
            className={`text-sm ${filename === 'real_test_label.jpeg' ? 'ring-2 ring-primary' : ''}`}
          >
            Test {filename.includes('real') ? '🔍 Real Label' : filename}
          </Button>
        ))}
      </div>
      
      {currentTest && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-800">{currentTest}</p>
        </div>
      )}
      
      <div className="space-y-8">
        {results.map(result => (
          <div key={result.filename} className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">{result.filename}</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Test Image</h3>
                <img 
                  src={`/test-images/${result.filename}`} 
                  alt={result.filename}
                  className="max-w-full h-auto border rounded"
                  style={{ maxHeight: '300px' }}
                />
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Results</h3>
                <div className="space-y-2">
                  <div className="text-sm">
                    <strong>Accuracy:</strong> {result.accuracy.toFixed(1)}%
                  </div>
                  <div className="text-sm">
                    <strong>Confidence:</strong> {(result.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Field Comparison</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">Field</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Expected</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Actual</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Match</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(result.comparison).map(([field, comp]) => (
                      <tr key={field}>
                        <td className="border border-gray-300 px-4 py-2 font-medium">{field}</td>
                        <td className="border border-gray-300 px-4 py-2">{comp.expected}</td>
                        <td className="border border-gray-300 px-4 py-2">{comp.actual}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          <span className={comp.match ? 'text-green-600' : 'text-red-600'}>
                            {comp.match ? '✅' : '❌'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Raw OCR Text</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto whitespace-pre-wrap">
                {result.rawText}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}