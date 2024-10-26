<?php

require_once '/home/keluwhr/sites/lucabandiera.it/utility/config.php';

// Airtable API credentials
$airtable_api_token = AIRTABLE_API_TOKEN;
$airtable_base = AIRTABLE_BASE;
$airtable_trainers = AIRTABLE_TRAINERS_TABLE;

// Debug info
echo "Base ID: " . $airtable_base . "<br>";
echo "Table: " . $airtable_trainers . "<br>";

// Get trainers data - using full API URL format
$url = "https://api.airtable.com/v0/" . $airtable_base . "/" . urlencode($airtable_trainers);
echo "URL: " . $url . "<br>";

$curl = curl_init($url);

curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer " . $airtable_api_token,
]);

$response = curl_exec($curl);
$httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
curl_close($curl);

if ($httpCode == 200) {
    $data = json_decode($response, true);
    echo "<pre>";
    print_r($data);
    echo "</pre>";
} else {
    echo "Error: " . $httpCode . "<br>";
    echo "Response: " . $response . "<br>";
}