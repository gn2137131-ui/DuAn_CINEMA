package com.cinema.ticketsystem.controller.loyalty;

import com.cinema.ticketsystem.dto.loyalty.AchievementDTO;
import com.cinema.ticketsystem.dto.loyalty.MembershipTierDTO;
import com.cinema.ticketsystem.service.loyalty.LoyaltyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/loyalty")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Assuming we want admin access from frontend
public class LoyaltyController {

    private final LoyaltyService loyaltyService;

    // --- Achievements ---

    @GetMapping("/achievements")
    public ResponseEntity<List<AchievementDTO>> getAllAchievements() {
        return ResponseEntity.ok(loyaltyService.getAllAchievements());
    }

    @GetMapping("/achievements/{id}")
    public ResponseEntity<AchievementDTO> getAchievementById(@PathVariable Long id) {
        AchievementDTO dto = loyaltyService.getAchievementById(id);
        return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.notFound().build();
    }

    @PostMapping("/achievements")
    public ResponseEntity<AchievementDTO> createAchievement(@RequestBody AchievementDTO dto) {
        return ResponseEntity.ok(loyaltyService.createAchievement(dto));
    }

    @PutMapping("/achievements/{id}")
    public ResponseEntity<AchievementDTO> updateAchievement(@PathVariable Long id, @RequestBody AchievementDTO dto) {
        AchievementDTO updated = loyaltyService.updateAchievement(id, dto);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/achievements/{id}")
    public ResponseEntity<Void> deleteAchievement(@PathVariable Long id) {
        loyaltyService.deleteAchievement(id);
        return ResponseEntity.ok().build();
    }

    // --- Membership Tiers ---

    @GetMapping("/tiers")
    public ResponseEntity<List<MembershipTierDTO>> getAllTiers() {
        return ResponseEntity.ok(loyaltyService.getAllMembershipTiers());
    }

    @GetMapping("/tiers/{id}")
    public ResponseEntity<MembershipTierDTO> getTierById(@PathVariable Long id) {
        MembershipTierDTO dto = loyaltyService.getMembershipTierById(id);
        return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.notFound().build();
    }

    @PostMapping("/tiers")
    public ResponseEntity<MembershipTierDTO> createTier(@RequestBody MembershipTierDTO dto) {
        return ResponseEntity.ok(loyaltyService.createMembershipTier(dto));
    }

    @PutMapping("/tiers/{id}")
    public ResponseEntity<MembershipTierDTO> updateTier(@PathVariable Long id, @RequestBody MembershipTierDTO dto) {
        MembershipTierDTO updated = loyaltyService.updateMembershipTier(id, dto);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/tiers/{id}")
    public ResponseEntity<Void> deleteTier(@PathVariable Long id) {
        loyaltyService.deleteMembershipTier(id);
        return ResponseEntity.ok().build();
    }
}
