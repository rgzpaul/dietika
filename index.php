<?php
require_once '/home/keluwhr/sites/lucabandiera.it/utility/config.php';
require_once 'functions.php';

// Handle login
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['username'])) {
    if (authenticateTrainer($_POST['username'], $_POST['password'])) {
        header('Location: ' . $_SERVER['PHP_SELF']);
        exit;
    } else {
        $error = "Invalid credentials";
    }
}

// Check if user is logged in, if not show login form
if (!isLoggedIn()) {
    ?>
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Login</title>
        <link rel="stylesheet" href="styles.css">
    </head>
    <body>
        <div class="container">
            <h1>Login</h1>
            <form method="post" id="loginForm">
                <input type="text" name="username" placeholder="Username" required>
                <input type="password" name="password" placeholder="Password" required>
                <button type="button" onclick="submitForm()">Submit</button>
                <?php if (isset($error)) echo "<p>$error</p>"; ?>
            </form>
        </div>
        <script>
            function submitForm() {
                document.getElementById('loginForm').submit();
            }
        </script>
    </body>
    </html>
    <?php
    exit;
}

$cleanFoodItems = array_map(function($item) {
    return [
        'fields' => [
            'Alimento' => $item['fields']['Alimento'],
            'Carboidrati' => floatval($item['fields']['Carboidrati']),
            'Proteine' => floatval($item['fields']['Proteine']),
            'Grassi' => floatval($item['fields']['Grassi'])
        ]
    ];
}, $foodItems);
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

        <script>
            window.foodItems = <?php echo json_encode($foodItems, JSON_NUMERIC_CHECK); ?>;
        </script>
        <script src="functions.js"></script>
    </div>
</body>
</html>