import { describe, it, expect } from 'vitest';
import astAnalysisService from '../../services/astAnalysisService';
import plagiarismService from '../../services/plagiarismService';

describe('AST Analysis & Plagiarism Detection Unit Tests', () => {
  it('should abstract variable identifiers and comments consistently', () => {
    const codeA = `
      // Calculate binary search
      function binarySearch(arr, target) {
        let left = 0;
        let right = arr.length - 1;
        while (left <= right) {
          let mid = Math.floor((left + right) / 2);
          if (arr[mid] === target) return mid;
          if (arr[mid] < target) left = mid + 1;
          else right = mid - 1;
        }
        return -1;
      }
    `;

    const codeB = `
      /* Alternative variable naming */
      function searchItem(list, value) {
        let low = 0;
        let high = list.length - 1;
        while (low <= high) {
          let center = Math.floor((low + high) / 2);
          if (list[center] === value) return center;
          if (list[center] < value) low = center + 1;
          else high = center - 1;
        }
        return -1;
      }
    `;

    const tokensA = astAnalysisService.abstractTokens(codeA);
    const tokensB = astAnalysisService.abstractTokens(codeB);

    expect(tokensA).toEqual(tokensB);
  });

  it('should detect high similarity between structurally identical code', () => {
    const code1 = `
      function twoSum(nums, target) {
        const map = new Map();
        for (let i = 0; i < nums.length; i++) {
          const comp = target - nums[i];
          if (map.has(comp)) return [map.get(comp), i];
          map.set(nums[i], i);
        }
        return [];
      }
    `;

    const code2 = `
      function findIndices(array, goal) {
        const lookup = new Map();
        for (let idx = 0; idx < array.length; idx++) {
          const diff = goal - array[idx];
          if (lookup.has(diff)) return [lookup.get(diff), idx];
          lookup.set(array[idx], idx);
        }
        return [];
      }
    `;

    const tokens1 = astAnalysisService.abstractTokens(code1);
    const tokens2 = astAnalysisService.abstractTokens(code2);

    const fp1 = plagiarismService.generateFingerprint(tokens1);
    const fp2 = plagiarismService.generateFingerprint(tokens2);

    const similarity = plagiarismService.calculateSimilarity(fp1, fp2);
    expect(similarity).toBeGreaterThan(80);
  });

  it('should calculate accurate cyclomatic complexity', () => {
    const simpleCode = 'function add(a, b) { return a + b; }';
    expect(astAnalysisService.calculateCyclomaticComplexity(simpleCode)).toBe(1);

    const complexCode = `
      function check(x) {
        if (x > 0) {
          for (let i = 0; i < 10; i++) {
            if (i % 2 === 0 || i === 5) console.log(i);
          }
        } else if (x < -10) {
          while (x < 0) x++;
        }
        return x;
      }
    `;
    expect(astAnalysisService.calculateCyclomaticComplexity(complexCode)).toBeGreaterThanOrEqual(6);
  });
});
