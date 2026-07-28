const errorMap: Record<string, string> = {
  "Invalid login credentials": "Incorrect email or password.",
  "Email not confirmed": "Please verify your email before logging in.",
  "Too many requests": "Too many attempts. Please try again in a few minutes.",
  "User already registered": "An account with this email already exists.",
  "Password should be at least 6 characters": "Password must be at least 6 characters.",
}

const fallback = "Something went wrong. Please try again."

export const friendlyAuthError = (message: string): string => {
  if (message.startsWith("Email not confirmed")) {
    return errorMap["Email not confirmed"]
  }
  if (message.startsWith("Too many requests")) {
    return errorMap["Too many requests"]
  }
  if (message.startsWith("Invalid login credentials")) {
    return errorMap["Invalid login credentials"]
  }
  if (message.includes("429")) {
  return "Too many requests. Please wait a few minutes before trying again.";
  }
  return errorMap[message] ?? fallback
}
