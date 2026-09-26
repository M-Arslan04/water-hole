package com.example.waterhole;

/** No Android dependency: tested on the host JVM. A completed round is required. */
public final class AdBreakPolicy {
    private boolean playing;
    private int rounds;
    private long lastShown;
    public AdBreakPolicy(long now) { lastShown = now; }
    public void begin() { playing = true; }
    public void complete() { if (playing) { rounds++; playing = false; } }
    public boolean playing() { return playing; }
    public boolean eligible(long now) { return !playing && rounds >= 3 && now - lastShown >= 300_000L; }
    public void shown(long now) { lastShown = now; rounds = 0; }
}
