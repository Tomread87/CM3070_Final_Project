const mysql = require('mysql2/promise');

// Create the connection pool. The pool-specific settings are the defaults
const pool = mysql.createPool({
    host: 'localhost',
    user: 'users_connection',
    database: 'final_project',
    password: 'password',
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
    idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

console.log("MySQL database pool connected")

//function to get the user details from db when email or username are specified
async function getUser(email = null, username = null) {
    //no try catch so that error is thrown
    const rows = await pool.execute(
        'SELECT * FROM users WHERE username = ? OR email = ?',
        [username, email]
    );
    return rows[0][0]
}

//function to retrieve all the relevant data of a user
async function getUserData(id) {
    try {
        const [userData] = await pool.execute(
            `SELECT u.username, u.email, u.join_date, usl.location_name, usl.lat, usl.lng, COUNT(ke.entity_id) AS total_entries
            FROM users as u
            LEFT JOIN user_set_location as usl ON u.id = usl.user_id
            LEFT JOIN knowledge_entities AS ke ON u.id = ke.submitted_by
            WHERE u.id = ?
            GROUP BY u.id;`,
            [id]
        );
        return userData[0];
    } catch (error) {
        console.error('Database error:', error);
        throw error;
    }
}

//function to register a new user into the database
async function createUser(username, email, hashed_password) {
    try {
        const [result] = await pool.query(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashed_password]
        );
        return result.insertId
    } catch (error) {
        console.error('Database error:', error);
        throw error;
    }

}

//function to add a new enttity to db
async function addEntityToDatabase(data) {

    // Get e connection
    const connection = await pool.getConnection()

    try {
        // Begin transaction
        await connection.beginTransaction();

        // Insert into knowledge_entities and get the entity_id
        const [entityResult] =
            await connection.query('INSERT INTO knowledge_entities (entity_name, location, submitted_by, lat, lng, stateCode, countryCode) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [data.entityName, data.location, data.userId, data.lat, data.lng, data.stateCode, data.countryCode]);

        const entityId = entityResult.insertId;

        // Process and insert tags
        for (const tag of data.entityTag) {
            let tagId;

            // Check if tag already exists
            const [existingTag] = await connection.query('SELECT tag_id FROM tags WHERE tag_name = ?', [tag]);
            if (existingTag.length > 0) {
                tagId = existingTag[0].tag_id;
            } else {
                // Create new tag
                const [newTagResult] = await connection.query('INSERT INTO tags (tag_name, submitted_by) VALUES (?, ?)', [tag, data.userId]);
                tagId = newTagResult.insertId;
            }

            // Associate tag with entity
            await connection.query('INSERT INTO entity_knowledge_tags (entity_id, tag_id) VALUES (?, ?)', [entityId, tagId]);
        }

        // Insert phone number
        if (data.phoneNumber) {
            await connection.query('INSERT INTO entity_phones (entity_id, phone_number, submitted_by) VALUES (?, ?, ?)', [entityId, data.phoneNumber, data.userId]);
        }

        // Insert email
        if (data.email) {
            await connection.query('INSERT INTO entity_emails (entity_id, email, submitted_by) VALUES (?, ?, ?)', [entityId, data.email, data.userId]);
        }

        // Insert website
        if (data.website) {
            await connection.query('INSERT INTO entity_websites (entity_id, website_url, submitted_by) VALUES (?, ?, ?)', [entityId, data.website, data.userId]);
        }

        // Insert review
        if (data.review) {
            await connection.query('INSERT INTO entity_reviews (entity_id, review_text, submitted_by) VALUES (?, ?, ?)', [entityId, data.review, data.userId]);
        }

        // Commit transaction
        await connection.commit();
    } catch (error) {
        // Rollback transaction on error
        await connection.rollback();
        pool.releaseConnection()
        throw error;
    }

    pool.releaseConnection()
}

//function to retirev entities from db, either all locations or a specified location
async function getEntities(location = null, limit = 9, tags = []) {
    try {
        let query;
        let params = [];

        // Create subquery for filtering entities based on tags
        // Future consideration sort the values by number of matching tags
        let tagsSubquery = '';
        if (tags.length > 0) {
            tagsSubquery = `
                SELECT ekt.entity_id
                FROM entity_knowledge_tags ekt
                INNER JOIN tags t ON ekt.tag_id = t.tag_id
                WHERE t.tag_name IN (?)
                GROUP BY ekt.entity_id
            `;
            tags = tags.length > 0 ? tags : "";
            params.push(tags);
        }

        // Construct the WHERE clause for location and subquery from tags
        let whereClauses = [];
        if (tagsSubquery) {
            whereClauses.push(`ke.entity_id IN (${tagsSubquery})`);
        }
        if (location) {
            whereClauses.push("ke.location = ?");
            params.push(location);
        }


        // join all querries
        let whereClause = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Main query
        query = createMainGetEntitiesQuery(whereClause)

        // Add the limit to the parameters
        params.push(limit);

        const [rows] = await pool.query(query, params);
        return rows;
    } catch (error) {
        console.error('Database error:', error);
        throw error;
    }
}

//function to retirev entities from db that match the state code
async function getStateEntities(isoCode, countryCode, limit = 9, tags = []) {
    try {
        let query;
        let params = [];

        // Create subquery for filtering entities based on tags
        // Future consideration sort the values by number of matching tags
        
        let tagsSubquery = '';
        if (tags.length > 0) {
             
            tagsSubquery = `
                SELECT ekt.entity_id
                FROM entity_knowledge_tags ekt
                INNER JOIN tags t ON ekt.tag_id = t.tag_id
                WHERE t.tag_name IN (?)
                GROUP BY ekt.entity_id
            `;
            
            params.push(tags);
        }

        // Construct the WHERE clause for location and subquery from tags
        let whereClauses = [];
        if (tagsSubquery) {
            whereClauses.push(`ke.entity_id IN (${tagsSubquery})`);
        }
        if (isoCode && countryCode) {
            whereClauses.push("ke.stateCode = ? and ke.countryCode = ?");
            params.push(isoCode);
            params.push(countryCode);
        }


        // join all querries
        let whereClause = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Main query
        query = createMainGetEntitiesQuery(whereClause)

        // Add the limit to the parameters
        params.push(limit);



        const [rows] = await pool.query(query, params);

        return rows;
    } catch (error) {
        console.error('Database error:', error);
        throw error;
    }
}

//function to retrieve entities from db that match the country code
async function getCountryEntities(countryCode, limit = 9, tags = []) {
    try {
        let query;
        let params = [];

        // Create subquery for filtering entities based on tags
        // Future consideration sort the values by number of matching tags
        let tagsSubquery = '';
        if (tags.length > 0) {
            tagsSubquery = `
                SELECT ekt.entity_id
                FROM entity_knowledge_tags ekt
                INNER JOIN tags t ON ekt.tag_id = t.tag_id
                WHERE t.tag_name IN (?)
                GROUP BY ekt.entity_id
            `;
            tags = tags.length > 0 ? tags : "";
            params.push(tags);
        }

        // Construct the WHERE clause for location and subquery from tags
        let whereClauses = [];
        if (tagsSubquery) {
            whereClauses.push(`ke.entity_id IN (${tagsSubquery})`);
        }
        if (countryCode) {
            whereClauses.push("ke.countryCode = ?");
            params.push(countryCode);
        }


        // join all querries
        let whereClause = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Main query
        query = createMainGetEntitiesQuery(whereClause)

        // Add the limit to the parameters
        params.push(limit);

        const [rows] = await pool.query(query, params);
        return rows;
    } catch (error) {
        console.error('Database error:', error);
        throw error;
    }
}

// get all teh entites created by a user and possibly filter it by the tags
async function getUserCreatedEntities(userId, tags = [], limit = 50) {
    try {
        let query;
        let params = [];

        // Create subquery for filtering entities based on tags
        // Future consideration sort the values by number of matching tags
        let tagsSubquery = '';
        if (tags.length > 0) {
            tagsSubquery = `
                SELECT ekt.entity_id
                FROM entity_knowledge_tags ekt
                INNER JOIN tags t ON ekt.tag_id = t.tag_id
                WHERE t.tag_name IN (?)
                GROUP BY ekt.entity_id
            `;
            tags = tags.length > 0 ? tags : "";
            params.push(tags);
        }

        // Construct the WHERE clause to filter the query
        let whereClauses = [];
        if (tagsSubquery) {
            whereClauses.push(`ke.entity_id IN (${tagsSubquery})`);
        }
        if (userId) {
            whereClauses.push("ke.submitted_by = ?");
            params.push(userId);
        }


        // join all querries
        let whereClause = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Main query
        query = createMainGetEntitiesQuery(whereClause)

        // Add the limit to the parameters
        params.push(limit);

        const [rows] = await pool.query(query, params);
        return rows;
    } catch (error) {
        console.error('Database error:', error);
        throw error;
    }
}

async function getMostUsedTags() {
    try {
        const query = `
            SELECT t.tag_name, COUNT(ekt.tag_id) AS tag_count 
            FROM tags t
            JOIN entity_knowledge_tags ekt ON t.tag_id = ekt.tag_id
            GROUP BY t.tag_id
            ORDER BY tag_count DESC
        `;

        const [rows] = await pool.query(query);
        return rows;
    } catch (error) {
        console.error('Database error:', error);
        throw error;
    }
}

// saves the chosen location of user to the database
async function setUserLocation(data) {

    try {
        await pool.execute(
            `INSERT INTO user_set_location (user_id, location_name, lat, lng)
            VALUES (?, ?, ?, ?)  -- Use placeholders for values to be inserted
            ON DUPLICATE KEY UPDATE
                location_name = VALUES(location_name),
                lat = VALUES(lat),
                lng = VALUES(lng);`,
            [data.id, data.name, data.lat, data.lng]
        );
        return true
    } catch (error) {
        console.error('Database error:', error);
        throw error;
    }
}

// update badge of user if they get to a certain number of entries
async function updateUserBadge(userId, badge) {

    try {
        await pool.execute(
            `update user set badge = ? where id = ?`,
            [badge, userId]
        );
        return true
    } catch (error) {
        console.error('Database error:', error);
        throw error;
    }
}



// this is the main query to get all the entity information
function createMainGetEntitiesQuery(whereClause) {
    return `
    SELECT ke.*, 
           GROUP_CONCAT(DISTINCT em.email) AS emails, 
           GROUP_CONCAT(DISTINCT ep.phone_number) AS phone_numbers, 
           GROUP_CONCAT(DISTINCT ew.website_url) AS websites, 
           GROUP_CONCAT(DISTINCT er.review_text) AS reviews,
           GROUP_CONCAT(DISTINCT t.tag_name ORDER BY t.tag_id) AS tags,
           u.username,
           u.email AS user_email,
           u.join_date
    FROM knowledge_entities ke
    LEFT JOIN entity_emails em ON ke.entity_id = em.entity_id
    LEFT JOIN entity_phones ep ON ke.entity_id = ep.entity_id
    LEFT JOIN entity_websites ew ON ke.entity_id = ew.entity_id
    LEFT JOIN entity_reviews er ON ke.entity_id = er.entity_id
    LEFT JOIN entity_knowledge_tags ekt ON ke.entity_id = ekt.entity_id
    LEFT JOIN tags t ON ekt.tag_id = t.tag_id
    LEFT JOIN users u ON ke.submitted_by = u.id
    ${whereClause}
    GROUP BY ke.entity_id
    ORDER BY ke.entity_id DESC 
    LIMIT ?
`
}

// Export all relevat functions
module.exports = {
    getUser,
    createUser,
    addEntityToDatabase,
    getEntities,
    getStateEntities,
    getCountryEntities,
    getUserCreatedEntities,
    getMostUsedTags,
    getUserData,
    setUserLocation,
    updateUserBadge
} 