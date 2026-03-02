#!/bin/bash

# Create a new branch for the NaN fixes
git checkout -b features/fix-nan-steps-11-14

# Stage all changes
git add -A

# Commit the changes with a descriptive message
git commit -m "fix: Resolve NaN issues in Steps 11-14 by extending calculation chain

- Extended Zustand store to call all calculation methods through Step 14
- Updated Step 11 to display actual machine parameters (reactances, time constants)
- Updated Step 12 to calculate short-circuit currents with proper values
- Updated Step 13 to calculate static overload capacity with stability metrics
- Updated Step 14 to display losses and efficiency with actual calculations
- Fixed JSX escaping issue in Step13 for greater-than symbol
- Fixed CSS import order in index.css
- All NaN values replaced with calculated or default values"

# Push the branch to GitHub
git push origin features/fix-nan-steps-11-14

echo "Branch 'features/fix-nan-steps-11-14' created and pushed to GitHub successfully!"
