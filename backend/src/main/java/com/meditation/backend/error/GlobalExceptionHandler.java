package com.meditation.backend.error;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<ProblemDetail> handleResponseStatus(ResponseStatusException ex) {
    int statusCode = ex.getStatusCode().value();
    log.warn("ResponseStatusException: status={} reason={}", statusCode, ex.getReason());
    HttpStatus httpStatus = HttpStatus.resolve(statusCode);
    String title = httpStatus != null ? httpStatus.getReasonPhrase() : "Error";
    return ResponseEntity.status(statusCode).body(
        ProblemDetail.of(statusCode, title, ex.getReason())
    );
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  public ProblemDetail handleUnreadableMessage(HttpMessageNotReadableException ex) {
    log.warn("Malformed request body: {}", ex.getMessage());
    return ProblemDetail.of(HttpStatus.BAD_REQUEST.value(), "Bad Request", "Malformed request body");
  }

  @ExceptionHandler(NoHandlerFoundException.class)
  @ResponseStatus(HttpStatus.NOT_FOUND)
  public ProblemDetail handleNoHandler(NoHandlerFoundException ex) {
    log.debug("No handler found: {} {}", ex.getHttpMethod(), ex.getRequestURL());
    return ProblemDetail.of(HttpStatus.NOT_FOUND.value(), "Not Found",
        "No resource at " + ex.getRequestURL());
  }

  // Spring 6.1+ throws NoResourceFoundException (not a ResponseStatusException) for unmatched static resources
  @ExceptionHandler(NoResourceFoundException.class)
  @ResponseStatus(HttpStatus.NOT_FOUND)
  public ProblemDetail handleNoResource(NoResourceFoundException ex) {
    log.debug("No resource found: {}", ex.getMessage());
    return ProblemDetail.of(HttpStatus.NOT_FOUND.value(), "Not Found", "Resource not found");
  }

  @ExceptionHandler(Exception.class)
  @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
  public ProblemDetail handleGeneral(Exception ex) {
    log.error("Unhandled exception", ex);
    return ProblemDetail.of(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Internal Server Error",
        "An internal error occurred");
  }
}
