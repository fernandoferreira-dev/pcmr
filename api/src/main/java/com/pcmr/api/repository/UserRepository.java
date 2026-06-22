package com.pcmr.api.repository;

import com.pcmr.api.model.LoginModel;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends CrudRepository<LoginModel, Integer> {
    Optional<LoginModel> findByEmail(String email);
}
