package com.cinema.ticketsystem.controller.cinema;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import javax.sql.DataSource;

@RestController
@RequestMapping("/api/import-db")
@CrossOrigin("*")
public class ImportDatabaseController {

    @Autowired
    private DataSource dataSource;

    @PostMapping
    public String importDatabase(@RequestParam("file") MultipartFile file) {
        try {
            ResourceDatabasePopulator populator = new ResourceDatabasePopulator();
            populator.addScript(new ByteArrayResource(file.getBytes()));
            populator.setContinueOnError(true); // Ignore errors like "Table already exists"
            populator.execute(dataSource);
            return "<h1>Bơm dữ liệu thành công rực rỡ!</h1><p>Bạn có thể đóng trang này và mở Vercel lên tận hưởng!</p>";
        } catch (Exception e) {
            e.printStackTrace();
            return "<h1>Lỗi khi bơm dữ liệu:</h1><p>" + e.getMessage() + "</p>";
        }
    }
}
