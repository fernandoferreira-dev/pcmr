package controller.jbdc;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class errorHandlingJbdc extends Jdbc {

    public boolean status() {
        try {
            Connection connection = DriverManager.getConnection(getJbdcURL(getJdbcLocation(), getDatabaseName()), getUsername(), getPassword());
            System.out.println("Connected successfully to PostgreSQL server.");
            connection.close();
            return true;
        } catch (SQLException e) {
            System.out.print("Error connecting to PostgreSQL server.\n Log: ");
            e.printStackTrace();

            setErrorReponse("Error connecting to PostgreSQL server.\n Log: " + e);
            return false;
        }
    }
}