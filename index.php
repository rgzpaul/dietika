<?php
require_once '/home/keluwhr/sites/lucabandiera.it/utility/config.php';
require_once 'functions.php';
?>

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Macro-Based Meal Planner</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <h1>Macro-Based Meal Planner</h1>
        <form method="post" id="mealPlannerForm">
            <div class="total-inputs">
                <label for="total_kcals">Total Calories:</label>
                <input type="number" id="total_kcals" name="total_kcals" min="1" required>
                
                <label for="numero_di_pasti">Number of Meals:</label>
                <input type="number" id="numero_di_pasti" name="numero_di_pasti" min="1" required>
            </div>
            
            <div class="button-group">
                <button type="button" onclick="generateInputs()">Start</button>
                <button type="button" onclick="safeRefresh()">Refresh</button>
                <button type="button" onclick="window.location.href='./magic'">Magic</button>
            </div>

            <div id="inputs_container"></div>
            <button type="submit" id="submit_button" style="display: none;">Copy</button>
        </form>

        <script> const foodItems = <?php echo json_encode($foodItems); ?>; </script>
        <script src="functions.js"></script>
    </div>
</body>
</html>