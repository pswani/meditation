package com.meditation.backend.customplay;

public record CustomPlayDeleteResult(
    String outcome,
    CustomPlayResponse currentCustomPlay
) {
}
