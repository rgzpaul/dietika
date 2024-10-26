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
            <!-- This will be shown/hidden by JavaScript -->
        </div>
        <div id="output">
            <!-- Default error state that will be replaced if data exists -->
            <div class="error-container">
                <div class="error-message">
                    <h2>⚠️ Invalid Access</h2>
                    <p>This page cannot be accessed directly. Please generate a meal plan from the main page first.</p>
                    <button onclick="window.location.href='index.php'" style="margin: 0px">Go to Meal Planner</button>
                </div>
            </div>
        </div>
        <script>
            // Immediately check if we have data
            document.addEventListener('DOMContentLoaded', function() {
                const storedData = sessionStorage.getItem('mealPlanData');
                if (storedData) {
                    // Show print button if we have data
                    document.getElementById('buttonContainer').innerHTML = `
                        <button onclick="window.print()">Print</button>
                    `;
                }
            });
        </script>
        <script src="summary.js"></script>
        <script src="https://unpkg.com/lucide@latest"></script>
    </div>
</body>
</html>