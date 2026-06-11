package com.pcmr.api.controller;

import com.pcmr.api.model.LoginModel;
import com.pcmr.api.model.LoginResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Minimal login API.
 * This uses a hard-coded demo user so the project stays simple for now.
 */
@RestController
@RequestMapping("/api/auth")
public class LoginController {

	private static final String DEMO_USERNAME = "admin";
	private static final String DEMO_PASSWORD = "admin123";

	@GetMapping("/status")
	public ResponseEntity<LoginResponse> status() {
		return ResponseEntity.ok(new LoginResponse(true, "Login API is running", null));
	}

	@PostMapping("/login")
	public ResponseEntity<LoginResponse> login(@RequestBody LoginModel request) {
		if (request == null || !StringUtils.hasText(request.username()) || !StringUtils.hasText(request.password())) {
			return ResponseEntity.badRequest().body(
				new LoginResponse(false, "Username and password are required", null)
			);
		}

		if (DEMO_USERNAME.equals(request.username()) && DEMO_PASSWORD.equals(request.password())) {
			return ResponseEntity.ok(
				new LoginResponse(true, "Login successful", request.username())
			);
		}

		return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
			new LoginResponse(false, "Invalid username or password", null)
		);
	}
}