<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meal Plan Summary</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <h1>Meal Plan Summary</h1>
        <div id="buttonContainer" class="button-container">
            <button onclick="parseClipboard()">Generate Meal Plan</button>
            <button onclick="window.print()">Print</button>
        </div>
        <div id="output"></div>
        <script src="summary.js"></script>
    </div>
</body>
</html>