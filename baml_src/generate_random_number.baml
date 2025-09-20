function GenerateRandomNumber() -> RandomNumber {
  client Gemini
  prompt #"
    Generate a random number between 1 and 100.
    Return only the number, nothing else.
  "#
}
