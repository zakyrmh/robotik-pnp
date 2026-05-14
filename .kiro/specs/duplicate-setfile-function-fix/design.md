# Duplicate setFile Function Bugfix Design

## Overview

The onboarding page contains a duplicate function definition for `setFile` at lines 59 and 92, causing a TypeScript compilation error. The fix involves removing one of the duplicate definitions while ensuring all functionality remains intact. This is a straightforward duplicate removal with no behavioral changes required.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when the TypeScript compiler encounters duplicate function definitions with the same name in the same scope
- **Property (P)**: The desired behavior - the component should compile successfully with a single `setFile` function definition that updates the files state
- **Preservation**: All file upload functionality, state management, and component behavior must remain unchanged
- **setFile**: The function that updates the `files` state object by merging a new key-value pair
- **files**: The state object containing all uploaded files (igRobotikProof, igMrcProof, ytRobotikProof, pasFoto, ktmFoto, paymentProof)

## Bug Details

### Bug Condition

The bug manifests when the TypeScript compiler processes the onboarding page component. The component defines the `setFile` function twice - once at line 59 and again at line 92 - both with identical implementations. This violates JavaScript/TypeScript's rule that function names must be unique within a scope.

**Formal Specification:**
```
FUNCTION isBugCondition(sourceCode)
  INPUT: sourceCode of type string (component file content)
  OUTPUT: boolean
  
  RETURN countFunctionDefinitions(sourceCode, "setFile") > 1
         AND bothDefinitionsInSameScope(sourceCode, "setFile")
         AND compilationFails(sourceCode)
END FUNCTION
```

### Examples

- **Example 1**: Compiling `app/(private)/onboarding/page.tsx` results in error: "the name `setFile` is defined multiple times"
- **Example 2**: Attempting to load the onboarding page in the browser fails because the component cannot be compiled
- **Example 3**: Running `npm run build` or `pnpm build` fails due to the duplicate definition error
- **Edge Case**: Even though both definitions are identical, TypeScript treats this as an error rather than silently using one

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- The `setFile` function must continue to update the files state by merging the new key-value pair
- All step components (StepCommitment, StepUpload) must continue to receive and use `setFile` correctly
- File upload functionality across all steps must work exactly as before
- The files state object must maintain all six file properties (igRobotikProof, igMrcProof, ytRobotikProof, pasFoto, ktmFoto, paymentProof)
- The `handleFinalSubmit` function must continue to access all files from the files state correctly

**Scope:**
All functionality that does NOT involve the compilation process should be completely unaffected by this fix. This includes:
- All file upload interactions in StepCommitment and StepUpload
- State management for the files object
- File compression and upload logic in handleFinalSubmit
- All other component functionality (NIM validation, step navigation, etc.)

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is clear:

1. **Copy-Paste Error**: The developer likely copied the `setFile` function definition and accidentally pasted it twice in the component, resulting in duplicate definitions at lines 59 and 92.

2. **Identical Implementations**: Both definitions are exactly the same:
   ```typescript
   const setFile = (key: string, file: File | null) => {
     setFiles((prev) => ({ ...prev, [key]: file }));
   };
   ```

3. **Scope Conflict**: Both definitions exist in the same function scope (the OnboardingPage component body), which TypeScript correctly identifies as an error.

4. **No Conditional Logic**: There's no conditional logic or different contexts that would justify having two definitions - this is purely a duplicate.

## Correctness Properties

Property 1: Bug Condition - Compilation Success

_For any_ source code where duplicate function definitions exist (isBugCondition returns true), the fixed component SHALL compile successfully with only one function definition, eliminating the "name is defined multiple times" error.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation - File State Management

_For any_ function call to setFile with a key and file parameter (isBugCondition returns false - runtime behavior), the fixed code SHALL produce exactly the same state update as the original code, preserving the file upload functionality.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

The fix is straightforward: remove one of the duplicate `setFile` function definitions.

**File**: `app/(private)/onboarding/page.tsx`

**Function**: `setFile` (duplicate at line 92)

**Specific Changes**:
1. **Remove Duplicate Definition**: Delete the second `setFile` function definition at line 92 (lines 92-94)
   - Keep the first definition at line 59
   - Remove the duplicate that appears after the `handleCheckNim` function

2. **Verify Single Definition**: Ensure only one `setFile` definition remains in the component
   - The remaining definition should be at line 59
   - Implementation: `const setFile = (key: string, file: File | null) => { setFiles((prev) => ({ ...prev, [key]: file })); };`

3. **No Other Changes Required**: No changes to function signature, implementation, or usage
   - All props passed to child components remain unchanged
   - All calls to `setFile` continue to work with the single definition

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, verify the compilation error exists on unfixed code, then verify the fix resolves the error while preserving all functionality.

### Exploratory Bug Condition Checking

**Goal**: Confirm the compilation error exists BEFORE implementing the fix. Verify the root cause is indeed the duplicate function definition.

**Test Plan**: Attempt to compile the unfixed code and observe the TypeScript error. Verify that the error message specifically mentions duplicate `setFile` definitions.

**Test Cases**:
1. **Compilation Error Test**: Run `pnpm build` or TypeScript compiler on unfixed code (will fail with duplicate definition error)
2. **Line Number Verification**: Confirm error points to lines 59 and 92 as the duplicate locations (will fail on unfixed code)
3. **Page Load Test**: Attempt to load `/onboarding` page in browser (will fail due to compilation error)
4. **Function Count Test**: Parse the AST and count `setFile` definitions (will return 2 on unfixed code)

**Expected Counterexamples**:
- TypeScript error: "the name `setFile` is defined multiple times"
- Compilation fails with exit code 1
- Page cannot be rendered in the browser

### Fix Checking

**Goal**: Verify that after removing the duplicate definition, the component compiles successfully and the page loads.

**Pseudocode:**
```
FOR ALL sourceCode WHERE isBugCondition(sourceCode) DO
  fixedCode := removeDuplicateSetFile(sourceCode)
  ASSERT compilationSucceeds(fixedCode)
  ASSERT countFunctionDefinitions(fixedCode, "setFile") = 1
  ASSERT pageLoadsSuccessfully(fixedCode)
END FOR
```

### Preservation Checking

**Goal**: Verify that the file upload functionality works exactly the same after the fix as it did before (when the code was working).

**Pseudocode:**
```
FOR ALL (key, file) WHERE NOT isBugCondition(key, file) DO
  ASSERT setFile_fixed(key, file) = setFile_original(key, file)
  ASSERT filesState_fixed = filesState_original
END FOR
```

**Testing Approach**: Since we cannot run the unfixed code (it doesn't compile), we verify preservation by:
- Testing all file upload scenarios on the fixed code
- Comparing the fixed code's behavior against the expected behavior from the requirements
- Ensuring all child components receive and use `setFile` correctly

**Test Plan**: Test all file upload interactions on the FIXED code to ensure they work correctly.

**Test Cases**:
1. **File Upload in StepCommitment**: Verify uploading files in step 4 updates the files state correctly
2. **File Upload in StepUpload**: Verify uploading files in step 5 updates the files state correctly
3. **Multiple File Updates**: Verify uploading multiple files in sequence maintains all files in state
4. **File Replacement**: Verify uploading a new file for an existing key replaces the old file
5. **Null File Handling**: Verify setting a file to null (removal) works correctly
6. **Final Submit Access**: Verify `handleFinalSubmit` can access all files from the files state

### Unit Tests

- Test that the component compiles without errors
- Test that only one `setFile` function definition exists in the component
- Test that `setFile` correctly updates the files state with a new file
- Test that `setFile` correctly handles null values (file removal)
- Test that multiple calls to `setFile` accumulate files in the state object

### Property-Based Tests

- Generate random file upload sequences and verify the files state is updated correctly
- Generate random key-value pairs and verify `setFile` merges them into the state correctly
- Test that the function signature `(key: string, file: File | null) => void` is preserved

### Integration Tests

- Test the full onboarding flow from step 1 to step 5 with file uploads
- Test uploading files in step 4 (StepCommitment) and verifying they persist to step 5
- Test uploading files in step 5 (StepUpload) and verifying they are accessible in `handleFinalSubmit`
- Test that the page loads successfully in the browser after the fix
- Test that the build process completes successfully without compilation errors
