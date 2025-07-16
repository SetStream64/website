from flask import Flask, send_from_directory
import os

app = Flask(__name__)

# Create directories and files if they don't exist
os.makedirs('static', exist_ok=True)

# Default route serves index.html
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

# Route for CSS file
@app.route('/styles.css')
def css():
    return send_from_directory('.', 'styles.css')

# Route for JavaScript file
@app.route('/script.js')
def js():
    return send_from_directory('.', 'script.js')

if __name__ == '__main__':
    # Check if the required files exist, create them if they don't
    if not os.path.exists('index.html'):
        with open('index.html', 'w') as f:
            f.write('''<!DOCTYPE html>
<html>
<head>
    <title>Simple Flask App</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    <h1>Hello, Flask!</h1>
    <p>This is a simple Flask application serving static files.</p>
    <script src="/script.js"></script>
</body>
</html>''')
    
    if not os.path.exists('styles.css'):
        with open('styles.css', 'w') as f:
            f.write('''body {
    font-family: Arial, sans-serif;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background-color: #f5f5f5;
}

h1 {
    color: #333;
    text-align: center;
}

p {
    color: #666;
    line-height: 1.6;
}''')
    
    if not os.path.exists('script.js'):
        with open('script.js', 'w') as f:
            f.write('''document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded!');
    
    // Add a simple interaction
    const heading = document.querySelector('h1');
    heading.addEventListener('click', function() {
        alert('Hello from JavaScript!');
    });
});''')
    
    # Run the Flask app
    app.run(host='0.0.0.0', port=5000, debug=True) 