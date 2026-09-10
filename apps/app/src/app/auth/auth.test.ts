import { describe, expect, it } from "vitest";

const validateEmail = (value?: string) => {
  if (!value?.trim()) return "Work email is required";
  if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value.trim())) {
    return "Please enter a valid work email address";
  }
  return undefined;
};

const validatePassword = (value?: string) => {
  if (!value) return "Password is required";
  if (value.length < 8) return "Password must be at least 8 characters";
  return undefined;
};

const validatePasswordMatch = (password: string, confirmPassword: string) => {
  if (!confirmPassword) return "Please confirm your password";
  if (password !== confirmPassword) return "Passwords do not match";
  return undefined;
};

const validateOtp = (otp: string) => {
  if (!otp || otp.length < 6) return "Please enter the complete 6-digit code";
  if (!/^\d{6}$/.test(otp)) return "Code must be numeric";
  return undefined;
};

describe("Auth form validation logic", () => {
  it("rejects empty work email", () => {
    expect(validateEmail("")).toBe("Work email is required");
    expect(validateEmail("   ")).toBe("Work email is required");
  });

  it("validates work email format", () => {
    expect(validateEmail("notanemail")).toBe("Please enter a valid work email address");
    expect(validateEmail("user@")).toBe("Please enter a valid work email address");
    expect(validateEmail("user@domain")).toBe("Please enter a valid work email address");
    expect(validateEmail("you@company.com")).toBeUndefined();
  });

  it("enforces 8+ character password", () => {
    expect(validatePassword("")).toBe("Password is required");
    expect(validatePassword("short")).toBe("Password must be at least 8 characters");
    expect(validatePassword("1234567")).toBe("Password must be at least 8 characters");
    expect(validatePassword("securePass123")).toBeUndefined();
  });

  it("validates password confirmation match", () => {
    expect(validatePasswordMatch("securePass123", "")).toBe("Please confirm your password");
    expect(validatePasswordMatch("securePass123", "differentPass")).toBe("Passwords do not match");
    expect(validatePasswordMatch("securePass123", "securePass123")).toBeUndefined();
  });

  it("validates 6-digit OTP codes", () => {
    expect(validateOtp("")).toBe("Please enter the complete 6-digit code");
    expect(validateOtp("12345")).toBe("Please enter the complete 6-digit code");
    expect(validateOtp("12345a")).toBe("Code must be numeric");
    expect(validateOtp("123456")).toBeUndefined();
  });
});
