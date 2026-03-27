package com.meditation.backend.sankalpa;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sankalpas")
public class SankalpaController {

  private final SankalpaService sankalpaService;

  public SankalpaController(SankalpaService sankalpaService) {
    this.sankalpaService = sankalpaService;
  }

  @GetMapping
  public List<SankalpaProgressResponse> listSankalpas() {
    return sankalpaService.listSankalpas();
  }

  @PutMapping("/{sankalpaId}")
  public SankalpaProgressResponse saveSankalpa(
      @PathVariable String sankalpaId,
      @RequestBody SankalpaGoalUpsertRequest request
  ) {
    return sankalpaService.saveSankalpa(sankalpaId, request);
  }
}
