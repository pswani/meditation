package com.meditation.backend.error;

public record ProblemDetail(
    String type,
    String title,
    int status,
    String detail
) {

  public static ProblemDetail of(int status, String title, String detail) {
    return new ProblemDetail("about:blank", title, status, detail);
  }
}
