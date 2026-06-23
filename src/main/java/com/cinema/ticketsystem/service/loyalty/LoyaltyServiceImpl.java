package com.cinema.ticketsystem.service.loyalty;

import com.cinema.ticketsystem.dto.loyalty.AchievementDTO;
import com.cinema.ticketsystem.dto.loyalty.MembershipTierDTO;
import com.cinema.ticketsystem.entity.loyalty.Achievement;
import com.cinema.ticketsystem.entity.loyalty.MembershipTier;
import com.cinema.ticketsystem.repository.loyalty.AchievementRepository;
import com.cinema.ticketsystem.repository.loyalty.MembershipTierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LoyaltyServiceImpl implements LoyaltyService {

    private final AchievementRepository achievementRepository;
    private final MembershipTierRepository tierRepository;

    @Override
    public List<AchievementDTO> getAllAchievements() {
        return achievementRepository.findAll().stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    public AchievementDTO getAchievementById(Long id) {
        return achievementRepository.findById(id).map(this::mapToDTO).orElse(null);
    }

    @Override
    public AchievementDTO createAchievement(AchievementDTO dto) {
        Achievement achievement = new Achievement();
        achievement.setName(dto.getName());
        achievement.setDescription(dto.getDescription());
        achievement.setIconUrl(dto.getIconUrl());
        achievement.setRewardPoints(dto.getRewardPoints());
        return mapToDTO(achievementRepository.save(achievement));
    }

    @Override
    public AchievementDTO updateAchievement(Long id, AchievementDTO dto) {
        return achievementRepository.findById(id).map(achievement -> {
            achievement.setName(dto.getName());
            achievement.setDescription(dto.getDescription());
            achievement.setIconUrl(dto.getIconUrl());
            achievement.setRewardPoints(dto.getRewardPoints());
            return mapToDTO(achievementRepository.save(achievement));
        }).orElse(null);
    }

    @Override
    public void deleteAchievement(Long id) {
        achievementRepository.deleteById(id);
    }

    @Override
    public List<MembershipTierDTO> getAllMembershipTiers() {
        return tierRepository.findAllByOrderByMinPointsAsc().stream().map(this::mapTierToDTO).collect(Collectors.toList());
    }

    @Override
    public MembershipTierDTO getMembershipTierById(Long id) {
        return tierRepository.findById(id).map(this::mapTierToDTO).orElse(null);
    }

    @Override
    public MembershipTierDTO createMembershipTier(MembershipTierDTO dto) {
        MembershipTier tier = new MembershipTier();
        tier.setName(dto.getName());
        tier.setMinPoints(dto.getMinPoints());
        tier.setDiscountPercentage(dto.getDiscountPercentage());
        return mapTierToDTO(tierRepository.save(tier));
    }

    @Override
    public MembershipTierDTO updateMembershipTier(Long id, MembershipTierDTO dto) {
        return tierRepository.findById(id).map(tier -> {
            tier.setName(dto.getName());
            tier.setMinPoints(dto.getMinPoints());
            tier.setDiscountPercentage(dto.getDiscountPercentage());
            return mapTierToDTO(tierRepository.save(tier));
        }).orElse(null);
    }

    @Override
    public void deleteMembershipTier(Long id) {
        tierRepository.deleteById(id);
    }

    private AchievementDTO mapToDTO(Achievement achievement) {
        AchievementDTO dto = new AchievementDTO();
        dto.setId(achievement.getId());
        dto.setName(achievement.getName());
        dto.setDescription(achievement.getDescription());
        dto.setIconUrl(achievement.getIconUrl());
        dto.setRewardPoints(achievement.getRewardPoints());
        return dto;
    }

    private MembershipTierDTO mapTierToDTO(MembershipTier tier) {
        MembershipTierDTO dto = new MembershipTierDTO();
        dto.setId(tier.getId());
        dto.setName(tier.getName());
        dto.setMinPoints(tier.getMinPoints());
        dto.setDiscountPercentage(tier.getDiscountPercentage());
        return dto;
    }
}
