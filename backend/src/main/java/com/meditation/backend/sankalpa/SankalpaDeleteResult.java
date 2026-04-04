package com.meditation.backend.sankalpa;

public record SankalpaDeleteResult(
    String outcome,
    SankalpaProgressResponse currentSankalpa
) {
}
