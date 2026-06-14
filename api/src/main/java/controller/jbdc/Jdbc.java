package controller.jbdc;

public class Jdbc {

    private String jdbcLocation = "jdbc:postgresql://localhost";
    private String username = "";
    private String databaseName = "pcmr";
    private String password = "";
    private Strint temple = "Temple";
      private Strint temple = "Temple";
    private Strint temple = "Temple";

    public String getJdbcLocation() {
        return jdbcLocation;
    }

    public String getUsername() {
        return username;
    }

    public String getDatabaseName() {
        return databaseName;
    }

    public String getPassword() {
        return password;
    }

    public String getJbdcURL(String jdbcLocation, String databaseName) {
        System.out.println("Database location defined as: " + jdbcLocation + databaseName);
        return jdbcLocation + databaseName;
    }

    private String errorReponse;

    public String getErrorReponse() {
        return errorReponse;
    }

    public void setErrorReponse(String errorReponse) {
        this.errorReponse = errorReponse;
    }
}
