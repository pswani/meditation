package com.meditation.backend.customplay;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/custom-plays")
public class CustomPlayController {

  private final CustomPlayService customPlayService;

  public CustomPlayController(CustomPlayService customPlayService) {
    this.customPlayService = customPlayService;
  }

  @GetMapping
  public List<CustomPlayResponse> listCustomPlays() {
    return customPlayService.listCustomPlays();
  }

  @PutMapping("/{customPlayId}")
  public CustomPlayResponse saveCustomPlay(
      @PathVariable String customPlayId,
      @RequestBody CustomPlayUpsertRequest request
  ) {
    return customPlayService.saveCustomPlay(customPlayId, request);
  }

  @DeleteMapping("/{customPlayId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteCustomPlay(@PathVariable String customPlayId) {
    customPlayService.deleteCustomPlay(customPlayId);
  }
}
