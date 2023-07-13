#!/bin/bash

# Navigate to the lambda directory
cd lambda

# Install Python dependencies
pip install -r requirements.txt -t ./package

# Add the application code to the package
cp app.py ./package

# Create a zip file from the package
cd package
zip -r ../deployment_package.zip .
cd ..

# Clean up
rm -r package
