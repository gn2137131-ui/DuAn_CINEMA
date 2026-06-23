package com.cinema.ticketsystem.service.loyalty;

import com.cinema.ticketsystem.dto.loyalty.AchievementDTO;
import com.cinema.ticketsystem.dto.loyalty.MembershipTierDTO;

import java.util.List;

public interface LoyaltyService {
    // Achievements
    List<AchievementDTO> getAllAchievements();
    AchievementDTO getAchievementById(Long id);
    AchievementDTO createAchievement(AchievementDTO achievementDTO);
    AchievementDTO updateAchievement(Long id, AchievementDTO achievementDTO);
    void deleteAchievement(Long id);

    // Membership Tiers
    List<MembershipTierDTO> getAllMembershipTiers();
    MembershipTierDTO getMembershipTierById(Long id);
    MembershipTierDTO createMembershipTier(MembershipTierDTO tierDTO);
    MembershipTierDTO updateMembershipTier(Long id, MembershipTierDTO tierDTO);
    void deleteMembershipTier(Long id);
}
