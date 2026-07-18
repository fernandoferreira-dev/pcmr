package com.pcmr.api.repository;

import com.pcmr.api.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findAllByOrderByCreatedAtDesc();

    List<Notification> findByLidaFalseOrderByCreatedAtDesc();
}