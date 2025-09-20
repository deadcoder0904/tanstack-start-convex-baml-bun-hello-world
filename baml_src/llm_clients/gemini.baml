client<llm> Gemini {
  provider google-ai
  options {
    model gemini-2.5-pro
    api_key env.GEMINI_API_KEY
  }
}
