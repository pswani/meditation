package com.meditation.backend.config;

import java.nio.file.Path;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "meditation.backend.media")
public class MediaStorageProperties {

  private String root = "../local-data/media";
  private String customPlaySubdirectory = "custom-plays";
  private String soundSubdirectory = "sounds";
  private String publicPathPrefix = "/media";

  public String getRoot() {
    return root;
  }

  public void setRoot(String root) {
    this.root = root;
  }

  public String getCustomPlaySubdirectory() {
    return customPlaySubdirectory;
  }

  public void setCustomPlaySubdirectory(String customPlaySubdirectory) {
    this.customPlaySubdirectory = customPlaySubdirectory;
  }

  public String getPublicPathPrefix() {
    return publicPathPrefix;
  }

  public void setPublicPathPrefix(String publicPathPrefix) {
    this.publicPathPrefix = publicPathPrefix;
  }

  public Path getRootPath() {
    if (root == null || root.isBlank()) {
      throw new IllegalStateException("meditation.backend.media.root must not be blank.");
    }

    Path normalizedRoot = Path.of(root.strip()).normalize().toAbsolutePath().normalize();
    if (normalizedRoot.getNameCount() == 0) {
      throw new IllegalStateException("meditation.backend.media.root must not resolve to the filesystem root.");
    }

    return normalizedRoot;
  }

  public Path getCustomPlayDirectoryPath() {
    return resolveChildDirectoryPath(customPlaySubdirectory, "custom-play-subdirectory");
  }

  public String getSoundSubdirectory() {
    return soundSubdirectory;
  }

  public void setSoundSubdirectory(String soundSubdirectory) {
    this.soundSubdirectory = soundSubdirectory;
  }

  public Path getSoundDirectoryPath() {
    return resolveChildDirectoryPath(soundSubdirectory, "sound-subdirectory");
  }

  public String toPublicPath(String relativePath) {
    String normalizedPrefix = normalizePublicPathPrefix();
    String trimmedRelativePath = relativePath.startsWith("/")
        ? relativePath.substring(1)
        : relativePath;
    return normalizedPrefix + "/" + trimmedRelativePath;
  }

  public String getCustomPlayPublicPathPattern() {
    return toPublicPath(normalizeRelativeDirectory(customPlaySubdirectory, "custom-play-subdirectory")) + "/**";
  }

  public String getSoundPublicPathPattern() {
    return toPublicPath(normalizeRelativeDirectory(soundSubdirectory, "sound-subdirectory")) + "/**";
  }

  public String getCustomPlayResourceLocation() {
    return toResourceLocation(getCustomPlayDirectoryPath());
  }

  public String getSoundResourceLocation() {
    return toResourceLocation(getSoundDirectoryPath());
  }

  private String normalizePublicPathPrefix() {
    if (publicPathPrefix == null || publicPathPrefix.isBlank()) {
      throw new IllegalStateException("meditation.backend.media.public-path-prefix must not be blank.");
    }

    String normalizedPrefix = publicPathPrefix.strip();
    if (normalizedPrefix.startsWith("/") == false) {
      throw new IllegalStateException("meditation.backend.media.public-path-prefix must start with '/'.");
    }

    if (normalizedPrefix.length() > 1 && normalizedPrefix.endsWith("/")) {
      normalizedPrefix = normalizedPrefix.substring(0, normalizedPrefix.length() - 1);
    }

    return normalizedPrefix;
  }

  private Path resolveChildDirectoryPath(String configuredDirectory, String propertyName) {
    String relativeDirectory = normalizeRelativeDirectory(configuredDirectory, propertyName);
    Path rootPath = getRootPath();
    Path resolvedPath = rootPath.resolve(relativeDirectory).normalize();
    if (resolvedPath.startsWith(rootPath) == false) {
      throw new IllegalStateException("meditation.backend.media." + propertyName + " must stay within the configured media root.");
    }

    return resolvedPath;
  }

  private String normalizeRelativeDirectory(String configuredDirectory, String propertyName) {
    if (configuredDirectory == null || configuredDirectory.isBlank()) {
      throw new IllegalStateException("meditation.backend.media." + propertyName + " must not be blank.");
    }

    Path normalizedPath = Path.of(configuredDirectory.strip()).normalize();
    String normalizedValue = normalizedPath.toString().replace('\\', '/');
    if (normalizedPath.isAbsolute() || normalizedValue.isBlank() || normalizedValue.equals(".") || normalizedValue.startsWith("..")) {
      throw new IllegalStateException("meditation.backend.media." + propertyName + " must be a relative child directory.");
    }

    return normalizedValue;
  }

  private String toResourceLocation(Path directoryPath) {
    String uri = directoryPath.toUri().toString();
    return uri.endsWith("/") ? uri : uri + "/";
  }
}
