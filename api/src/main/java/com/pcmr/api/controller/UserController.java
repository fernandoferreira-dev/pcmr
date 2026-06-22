package com.pcmr.api.controller;

import com.pcmr.api.model.LoginModel;
import com.pcmr.api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

	@Autowired
	private UserRepository userRepository;

	@PostMapping("/register")
	public String registerUser(@RequestParam String name,
							   @RequestParam String email,
							   @RequestParam String password) {
		LoginModel n = new LoginModel();
		n.setName(name);
		n.setEmail(email);
		n.setPassword(password);
		userRepository.save(n);
		return "User Saved successfully!";
	}
}
