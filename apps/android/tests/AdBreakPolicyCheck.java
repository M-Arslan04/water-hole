package com.example.waterhole;
public class AdBreakPolicyCheck {
    private static void check(boolean condition) { if (!condition) throw new AssertionError(); }
    public static void main(String[] args) {
        AdBreakPolicy p = new AdBreakPolicy(0);
        check(!p.eligible(900_000));
        p.complete(); p.complete(); p.complete(); check(!p.eligible(900_000)); // no phantom completions
        for (int i=0;i<3;i++) { p.begin(); check(!p.eligible(900_000)); p.complete(); }
        check(!p.eligible(299_999)); check(p.eligible(300_000));
        p.begin(); check(!p.eligible(900_000)); p.complete();
        p.shown(900_000); check(!p.eligible(1_800_000));
        for (int i=0;i<3;i++) { p.begin(); p.complete(); }
        check(!p.eligible(1_199_999)); check(p.eligible(1_200_000));
        System.out.println("PASS: real Java policy blocks active/incomplete rounds, enforces 3 completions + 5 minutes, resets after showing");
    }
}
