ALTER TABLE media_asset ADD CONSTRAINT chk_media_asset_mime_type
    CHECK (mime_type IN (
        'audio/mpeg', 'audio/wav', 'audio/aac', 'audio/ogg', 'audio/mp4',
        'audio/x-m4a', 'audio/flac'
    ));
