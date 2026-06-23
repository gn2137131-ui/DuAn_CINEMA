package com.cinema.ticketsystem.service.cinema;

import com.cinema.ticketsystem.entity.cinema.Combo;
import com.cinema.ticketsystem.entity.cinema.Concession;
import com.cinema.ticketsystem.repository.cinema.ComboRepository;
import com.cinema.ticketsystem.repository.cinema.ConcessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class ComboService {

    @Autowired
    private ComboRepository comboRepository;

    @Autowired
    private ConcessionRepository concessionRepository;

    public Combo createCombo(Combo combo) {
        // Link popcorn concession if provided
        if (combo.getPopcorn() != null && combo.getPopcorn().getId() != null) {
            Optional<Concession> pop = concessionRepository.findById(combo.getPopcorn().getId());
            pop.ifPresent(combo::setPopcorn);
        }
        // Link drink concession if provided
        if (combo.getDrink() != null && combo.getDrink().getId() != null) {
            Optional<Concession> dr = concessionRepository.findById(combo.getDrink().getId());
            dr.ifPresent(combo::setDrink);
        }

        return comboRepository.save(combo);
    }

    public Optional<Combo> updateCombo(Long id, Combo details) {
        Optional<Combo> comboOptional = comboRepository.findById(id);
        if (!comboOptional.isPresent()) return Optional.empty();

        Combo existing = comboOptional.get();

        if (details.getName() != null) existing.setName(details.getName());
        if (details.getDescription() != null) existing.setDescription(details.getDescription());
        if (details.getPrice() != null) existing.setPrice(details.getPrice());
        if (details.getActive() != null) existing.setActive(details.getActive());

        if (details.getPopcorn() != null) {
            if (details.getPopcorn().getId() != null) {
                concessionRepository.findById(details.getPopcorn().getId()).ifPresent(existing::setPopcorn);
            } else {
                existing.setPopcorn(null);
            }
        }
        if (details.getPopcornCount() != null) existing.setPopcornCount(details.getPopcornCount());

        if (details.getDrink() != null) {
            if (details.getDrink().getId() != null) {
                concessionRepository.findById(details.getDrink().getId()).ifPresent(existing::setDrink);
            } else {
                existing.setDrink(null);
            }
        }
        if (details.getDrinkCount() != null) existing.setDrinkCount(details.getDrinkCount());

        Combo updated = comboRepository.save(existing);
        return Optional.of(updated);
    }
}
