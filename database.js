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
            `SELECT u.id, u.username, u.email, u.join_date, usl.location_name, usl.lat, usl.lng, 
            COUNT(ke.entity_id) AS total_entries, u.badge, ui.original_name, ui.original_location, ui.thumbnail_location  
            FROM users as u
            LEFT JOIN user_set_location as usl ON u.id = usl.user_id
            LEFT JOIN knowledge_entities AS ke ON u.id = ke.submitted_by
            LEFT JOIN uploaded_images as ui on ui.id = u.image
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
        for (let tag of data.entityTag) {
            let tagId;
            tag = tag.toLowerCase().trim()

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


        // add image to upladed images table and link to entity
        if (data.dbImages && data.dbImages.length > 0) {
            for (const image of data.dbImages) {
                const [imageResult] =
                    await connection.query('INSERT INTO uploaded_images (original_name, original_location, thumbnail_location, uploaded_by) VALUES (?, ?, ?, ?);',
                        [image.originalName, image.original_location, image.thumbnail_location, data.userId]);

                const imageId = imageResult.insertId;

                await connection.query('INSERT INTO image_knowledge_link (image_id, entity_id) VALUES (?, ?);',
                    [imageId, entityId]);
            }
        }

        // Commit transaction
        await connection.commit();
    } catch (error) {
        // Rollback transaction on error
        await connection.rollback();
        pool.releaseConnection()
        throw error;
    } finally {
        pool.releaseConnection(connection)
    }


}

//function to update an entity
async function updateEntityInDatabase(data, orEntity) {
    // Get a connection from the pool
    const connection = await pool.getConnection();

    try {
        // Begin transaction
        await connection.beginTransaction();

        // Update knowledge_entities table
        if (data.lat && data.lng) {
            await connection.query(
                'UPDATE knowledge_entities SET entity_name = ?, location = ?, lat = ?, lng = ?, stateCode = ?, countryCode = ? WHERE entity_id = ?',
                [data.entityName, data.location, data.lat, data.lng, data.stateCode, data.countryCode, data.entityId]
            );
        } else {
            // only option that could be udated is 
            await connection.query(
                'UPDATE knowledge_entities SET entity_name = ? WHERE entity_id = ?',
                [data.entityName, data.location, data.lat, data.lng, data.stateCode, data.countryCode, data.entityId]
            );
        }

        if (data.entityTag != orEntity.tags.split(",")) {
            // Delete existing tags for the entity
            await connection.query('DELETE FROM entity_knowledge_tags WHERE entity_id = ?', [data.entityId]);

            // Process and insert tags
            for (let tag of data.entityTag) {
                let tagId;
                tag = tag.toLowerCase().trim();

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
                await connection.query('INSERT INTO entity_knowledge_tags (entity_id, tag_id) VALUES (?, ?)', [data.entityId, tagId]);
            }
        }


        // Update phone number
        if (data.phoneNumber) {
            if (orEntity.phone_numbers != null) {
                // Update phone number if it already exists
                await connection.query('UPDATE entity_phones SET phone_number = ? WHERE entity_id = ? and submitted_by = ?', [data.phoneNumber, data.entityId, data.userId]);
            } else {
                // Insert new phone number if it doesn't exist
                await connection.query('INSERT INTO entity_phones (entity_id, phone_number, submitted_by) VALUES (?, ?, ?)', [entityId, data.phoneNumber, data.userId]);
            }
        } else if (data.phoneNumber == "" && orEntity.phone_numbers != null) {
            // Delete phone number if it exists and incoming data is empty
            await connection.query('DELETE from entity_phones where entity_id = ? and submitted_by = ?', [entityId, data.userId]);
        }

        // Update email
        if (data.email) {
            if (orEntity.emails != null) {
                // Update email if it already exists
                await connection.query('UPDATE entity_emails SET email = ? WHERE entity_id = ? and submitted_by = ?', [data.email, data.entityId, data.userId]);
            } else {
                // Insert new email if it doesn't exist
                await connection.query('INSERT INTO entity_emails (entity_id, email, submitted_by) VALUES (?, ?, ?)', [entityId, data.email, data.userId]);
            }
        } else if (data.email == "" && orEntity.emails != null) {
            // Delete email if it exists and incoming data is empty
            await connection.query('DELETE from entity_emails where entity_id = ? and submitted_by = ?', [entityId, data.userId]);
        }


        // Update website
        if (data.website) {
            if (orEntity.websites != null) {
                // Update website if it already exists
                await connection.query('UPDATE entity_websites SET website_url = ? WHERE entity_id = ? and submitted_by = ?', [data.website, data.entityId, data.userId]);
            } else {
                // Insert new website if it doesn't exist
                await connection.query('INSERT INTO entity_websites (entity_id, website_url, submitted_by) VALUES (?, ?, ?)', [entityId, data.website, data.userId]);
            }
        } else if (data.website == "" && orEntity.websites != null) {
            // Delete website if it exists and incoming data is empty
            await connection.query('DELETE from entity_websites where entity_id = ? and submitted_by = ?', [entityId, data.userId]);
        }

        // Update review
        //find review owned by user
        const userReview = orEntity.reviews.filter(item => item.submitted_by == data.userId)
        const userReviewExists = userReview.length > 0;
        data.review = data.review.trim()

        if (data.review) {
            if (userReviewExists) {
                // Update review if it already exists
                await connection.query('UPDATE entity_reviews SET review_text = ? WHERE review_id = ? and submitted_by = ?', [data.review, userReview[0].review_id, data.userId]);
            } else {
                // Insert new review if it doesn't exist
                await connection.query('INSERT INTO entity_reviews (entity_id, review_text, submitted_by) VALUES (?, ?, ?)', [data.entityId, data.review, data.userId]);
            }
        } else if (data.review == "" && userReviewExists) {
            // Delete review if it exists and incoming data is empty
            await connection.query('DELETE from entity_reviews where review_id = ? and submitted_by = ?', [userReview[0].review_id, data.userId]);
        }

        // add image to upladed images table and link to entity
        if (data.dbImages && data.dbImages.length > 0) {
            for (const image of data.dbImages) {
                const [imageResult] =
                    await connection.query('INSERT INTO uploaded_images (original_name, original_location, thumbnail_location, uploaded_by) VALUES (?, ?, ?, ?);',
                        [image.originalName, image.original_location, image.thumbnail_location, data.userId]);

                const imageId = imageResult.insertId;

                await connection.query('INSERT INTO image_knowledge_link (image_id, entity_id) VALUES (?, ?);',
                    [imageId, entityId]);
            }
        }

        // Commit transaction
        await connection.commit();
    } catch (error) {
        // Rollback transaction on error
        await connection.rollback();
        throw error;
    } finally {
        // Release connection
        connection.release();
    }
}

//function to update an entity
async function addReviewToDatabase(data, orEntity) {
    // Get a connection from the pool
    const connection = await pool.getConnection();

    try {
        // Begin transaction
        await connection.beginTransaction();

        // Update or create review
        //find review owned by user
        const userReview = orEntity.reviews.filter(item => item.submitted_by == data.userId)
        const userReviewExists = userReview.length > 0;
        data.review = data.review.trim()

        if (data.review) {
            if (userReviewExists) {
                // Update review if it already exists
                await connection.query('UPDATE entity_reviews SET review_text = ? WHERE review_id = ? and submitted_by = ?', [data.review, userReview[0].review_id, data.userId]);
            } else {
                // Insert new review if it doesn't exist
                await connection.query('INSERT INTO entity_reviews (entity_id, review_text, submitted_by) VALUES (?, ?, ?)', [data.entityId, data.review, data.userId]);
            }
        } /*else if (data.review == "" && userReviewExists) {
            // Delete review if it exists and incoming data is empty
            await connection.query('DELETE from entity_reviews where review_id = ? and submitted_by = ?', [userReview[0].review_id, data.userId]);
        }*/

        // add image to upladed images table and link to entity
        if (data.dbImages && data.dbImages.length > 0) {
            for (const image of data.dbImages) {
                const [imageResult] =
                    await connection.query('INSERT INTO uploaded_images (original_name, original_location, thumbnail_location, uploaded_by) VALUES (?, ?, ?, ?);',
                        [image.originalName, image.original_location, image.thumbnail_location, data.userId]);

                const imageId = imageResult.insertId;

                await connection.query('INSERT INTO image_knowledge_link (image_id, entity_id) VALUES (?, ?);',
                    [imageId, entityId]);
            }
        }

        // Commit transaction
        await connection.commit();
    } catch (error) {
        // Rollback transaction on error
        await connection.rollback();
        throw error;
    } finally {
        // Release connection
        connection.release();
    }
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

//function to retrieve entities from the database for multiple locations
async function getEntitiesForMultipleLocations(locations, limit = 10000, tags = []) {
    try {
        let query;
        let params = [];

        // Create subquery for filtering entities based on tags
        // Future consideration: sort the values by the number of matching tags
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

        // Construct the WHERE clause for locations and subquery from tags
        let whereClauses = [];
        if (tagsSubquery) {
            whereClauses.push(`ke.entity_id IN (${tagsSubquery})`);
        }
        if (locations && locations.length > 0) {
            let locationParams = locations.map(location => location.name);
            whereClauses.push(`ke.location IN (${Array(locationParams.length).fill('?').join(', ')})`);
            params.push(...locationParams);
        }

        // Join all queries
        let whereClause = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Main query
        query = createMainGetEntitiesQuery(whereClause);

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
async function getStateEntities(isoCodes, countryCode, limit = 10000, tags = []) {
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


        // Construct the WHERE clause for state codes and country code
        if (isoCodes && Array.isArray(isoCodes) && isoCodes.length > 0) {
            // If isoCodes is an array, construct multiple OR conditions for each state
            const stateConditions = isoCodes.map(() => '(ke.stateCode = ? AND ke.countryCode = ?)').join(' OR ');
            whereClauses.push(`(${stateConditions})`);
            //console.log(isoCodes);
            isoCodes.forEach(state => { params.push(state.isoCode); params.push(state.countryCode); });
        } else if (isoCodes && !Array.isArray(isoCodes) && countryCode) {
            // If isoCodes is a single state code
            whereClauses.push('ke.stateCode = ? AND ke.countryCode = ?');
            params.push(isoCodes);
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
async function getCountryEntities(countryCodes, limit = 10000, tags = []) {
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


        // Construct the WHERE clause for state codes and country code
        if (countryCodes && Array.isArray(countryCodes) && countryCodes.length > 0) {

            const countryConditions = countryCodes.map(() => 'ke.countryCode = ?').join(' OR ');
            whereClauses.push(`(${countryConditions})`);
            countryCodes.forEach(country => { params.push(country.isoCode); });
        } else if (countryCodes && !Array.isArray(countryCodes)) {
            whereClauses.push("ke.countryCode = ?");
            params.push(countryCodes);
        }


        if (countryCodes) {

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
async function getUserCreatedEntities(userId, limit = 50, tags = []) {
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
        whereClauses = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Main query
        query = createMainGetEntitiesQuery(whereClauses)

        // Add the limit to the parameters
        params.push(limit);

        const [rows] = await pool.query(query, params);

        return rows;
    } catch (error) {
        console.error('Database error:', error);
        throw error;
    }
}

async function getEntity(id) {
    try {
        let query;
        let params = [];

        // Construct the WHERE clause to filter the query
        let whereClauses = 'where ke.entity_id = ?'

        // Main query
        query = createMainGetEntitiesQuery(whereClauses)

        // Add the limit to the parameters
        params.push(id);

        //set limit
        params.push(1)

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

//get all images of hte entites 
async function getAllImagesFromEntities(entities_ids) {

    try {

        let query = `SELECT u.id, u.original_name, u.original_location, u.thumbnail_location, u.created_at, u.uploaded_by, ikl.entity_id
        FROM uploaded_images u
        JOIN image_knowledge_link ikl ON u.id = ikl.image_id
        WHERE ikl.entity_id IN (?);`

        const [images] = await pool.query(
            query,
            [entities_ids]
        );


        return images
    } catch (error) {
        console.error('Database error:', error);
        throw error;
    }
}

//get all images of the entites 
async function getReviewsFromEntities(entities_ids) {

    try {

        let query = `SELECT r.entity_id, r.review_id, r.review_text, r.submitted_by, u.username, u.image, u.badge, u.username FROM entity_reviews r 
        join users u on r.submitted_by = u.id
        WHERE r.entity_id IN (?);`

        const [reviews] = await pool.query(
            query,
            [entities_ids]
        );


        return reviews
    } catch (error) {
        console.error('Database error:', error);
        throw error;
    }
}

//get all images of the entites 
async function getReviewsFromEntities(entities_ids) {

    try {

        let query = `SELECT r.entity_id, r.review_id, r.review_text, r.submitted_by, u.username, u.image, u.badge, u.username FROM entity_reviews r 
        join users u on r.submitted_by = u.id
        WHERE r.entity_id IN (?);`

        const [reviews] = await pool.query(
            query,
            [entities_ids]
        );


        return reviews
    } catch (error) {
        console.error('Database error:', error);
        throw error;
    }
}

//gets all reviews and images of entities
async function attachAddInfoToEntities(entities) {
    // Extracting entity_id values and joining them into a string
    const entityIds = entities.map(entity => entity.entity_id)

    try {
        const images = await getAllImagesFromEntities(entityIds);
        const reviews = await getReviewsFromEntities(entityIds)
        // Add images to entities with the same entity_id
        entities.forEach(entity => {
            entity.images = images.filter(image => image.entity_id === entity.entity_id);
            entity.reviews = reviews.filter(review => review.entity_id === entity.entity_id);
        });


        return entities;
    } catch (error) {
        console.error('Error fetching images:', error);
        throw error; // Propagate the error
    }
}

// set the new image as profile return old iamge to be deleted
async function changeProfileImage(userId, fileInfo) {

    // Get e connection
    const connection = await pool.getConnection()

    let fileToDelete = false

    try {
        // Start a transaction
        await connection.beginTransaction();
        // Fetch the current image details
        const [currentImageRows] = await connection.query('SELECT image FROM users WHERE id = ?', [userId]);

        if (currentImageRows.length > 0) {
            const currentImageId = currentImageRows[0].image;
            const [imageToDeleteRows] = await connection.query('SELECT * FROM uploaded_images WHERE id = ?', [currentImageId]);
            if (imageToDeleteRows.length > 0) {
                fileToDelete = imageToDeleteRows[0];
            }
        }

        // Insert the new image details
        const [imageResult] = await connection.query('INSERT INTO uploaded_images (original_name, original_location, thumbnail_location, uploaded_by) VALUES (?, ?, ?, ?)',
            [fileInfo.originalName, fileInfo.original_location, fileInfo.thumbnail_location, userId]);

        // update user image
        const imageId = imageResult.insertId;
        await connection.query('UPDATE users SET image = ? WHERE id = ?', [imageId, userId])

        // delete from DB old image
        if (currentImageRows.length > 0) {
            await connection.query('DELETE FROM uploaded_images WHERE id = ?', [fileToDelete.id])
        }


        // Commit the transaction
        await connection.commit();

        return fileToDelete

    } catch (error) {
        console.error('Error fetching images:', error);
        throw error; // Propagate the error
    } finally {
        // Regardless of whether an error occurred or not, release the connection back to the pool
        pool.releaseConnection(connection)
    }


}

// saves the vote of a user in teh databse or updates teh value if vote alerasdy exists
async function saveOrUpdateVote(user_id, entity_id, vote_type) {

    // Get e connection
    const connection = await pool.getConnection()
    let action = ""
    let vote

    try {

        // Start a transaction
        await connection.beginTransaction();

        // Check if the entity exists
        const [entity] = await connection.query(
            'SELECT * FROM knowledge_entities WHERE entity_id = ?',
            [entity_id]
        );

        if (entity.length === 0) {
            throw new Error('Entity does not exist');
        }

        // Check if a vote for the same entity by the same user already exists
        const [existingVote] = await connection.query(
            'SELECT * FROM entity_votes WHERE entity_id = ? AND user_id = ?',
            [entity_id, user_id]
        );

        if (existingVote.length > 0) {
            // Update the existing vote
            await connection.query(
                'UPDATE entity_votes SET vote_type = ? WHERE entity_id = ? AND user_id = ?',
                [vote_type, entity_id, user_id]
            );
            action = "update"
            vote = existingVote[0].vote_type
            //console.log('Vote updated successfully');
        } else {
            // Insert a new vote
            await connection.query(
                'INSERT INTO entity_votes (entity_id, user_id, vote_type) VALUES (?, ?, ?)',
                [entity_id, user_id, vote_type]
            );
            action = "insert"; vote = vote_type
            //console.log('Vote saved successfully');
        }

        // Commit the transaction
        await connection.commit();
    } catch (error) {
        console.error('Error saving or updating vote:', error);
        throw error; // Propagate the error
    } finally {
        // Regardless of whether an error occurred or not, release the connection back to the pool
        pool.releaseConnection(connection)
        return { action, db_vote: vote }
    }
}

// adds an entity to the entity_deletions table
async function deleteEntityToTable(entity_id, user_id) {
    // add to tqable only if not in the table
    try {
        let query = ` 
        INSERT INTO entity_deletions (entity_id, user_id)
        SELECT ? AS entity_id, ? AS user_id
        FROM dual
        WHERE NOT EXISTS (
            SELECT * 
            FROM entity_deletions 
            WHERE entity_id = ? AND user_id = ?
        );`

        const [success] = await pool.query(query, [entity_id, user_id, entity_id, user_id]);


        return success
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
           GROUP_CONCAT(DISTINCT t.tag_name ORDER BY t.tag_id) AS tags,
           u.username,
           u.email AS user_email,
           u.join_date,
           u.badge,
           COALESCE(v.total_votes, 0) AS total_votes
    FROM knowledge_entities ke
    LEFT JOIN entity_emails em ON ke.entity_id = em.entity_id
    LEFT JOIN entity_phones ep ON ke.entity_id = ep.entity_id
    LEFT JOIN entity_websites ew ON ke.entity_id = ew.entity_id
    LEFT JOIN entity_knowledge_tags ekt ON ke.entity_id = ekt.entity_id
    LEFT JOIN tags t ON ekt.tag_id = t.tag_id
    LEFT JOIN users u ON ke.submitted_by = u.id
    LEFT JOIN (
        SELECT entity_id, SUM(vote_type) AS total_votes
        FROM entity_votes
        GROUP BY entity_id
    ) v ON ke.entity_id = v.entity_id
    ${whereClause}
    AND ke.entity_id NOT IN (        
        SELECT DISTINCT entity_id
        FROM entity_deletions)  -- Exclude deleted entities
    GROUP BY ke.entity_id
    ORDER BY ke.entity_id DESC 
    LIMIT ?
`

    /*
        SELECT ke.*,                                                            -- Select all columns from the knowledge_entities table
                GROUP_CONCAT(DISTINCT em.email) AS emails,                      -- Concatenate distinct email addresses into a comma-separated list
                GROUP_CONCAT(DISTINCT ep.phone_number) AS phone_numbers,        -- Concatenate distinct phone numbers into a comma-separated list
                GROUP_CONCAT(DISTINCT ew.website_url) AS websites,              -- Concatenate distinct website URLs into a comma-separated list
                GROUP_CONCAT(DISTINCT t.tag_name ORDER BY t.tag_id) AS tags,    -- Concatenate distinct tag names into a comma-separated list, ordered by tag ID
                u.username,                                                     -- Select the username of the user who submitted the entity
                u.email AS user_email,                                          -- Select the email address of the user who submitted the entity
                u.join_date,                                                    -- Select the join date of the user who submitted the entity
                u.badge,                                                        -- Select the badge of the user who submitted the entity
                COALESCE(v.total_votes, 0) AS total_votes                       -- Calculate the total votes for each entity, handling NULL values with COALESCE
        FROM knowledge_entities ke                                              -- Main table: knowledge_entities
        LEFT JOIN entity_emails em ON ke.entity_id = em.entity_id               -- Join table: entity_emails
        LEFT JOIN entity_phones ep ON ke.entity_id = ep.entity_id               -- Join table: entity_phones
        LEFT JOIN entity_websites ew ON ke.entity_id = ew.entity_id             -- Join table: entity_websites
        LEFT JOIN entity_knowledge_tags ekt ON ke.entity_id = ekt.entity_id     -- Join table: entity_knowledge_tags
        LEFT JOIN tags t ON ekt.tag_id = t.tag_id                               -- Join table: tags
        LEFT JOIN users u ON ke.submitted_by = u.id                             -- Join table: users
        LEFT JOIN (
            SELECT entity_id, SUM(vote_type) AS total_votes                     -- Calculate the total votes for each entity
            FROM entity_votes                                                   -- Main table: entity_votes
            GROUP BY entity_id                                                  -- Group by entity_id to get total votes for each entity
        ) v ON ke.entity_id = v.entity_id                                       -- Join the subquery results to the main table
        LEFT JOIN (
            SELECT DISTINCT entity_id                                           -- Select distinct entity IDs from the entity_deletions table
            FROM entity_deletions                                               -- Main table: entity_deletions
        ) ed ON ke.entity_id = ed.entity_id                                     -- Join table: entity_deletions
        ${whereClause}                                                          -- Apply any additional WHERE conditions based on the whereClause variable
        AND ed.entity_id IS NULL                                                -- Exclude deleted entities
        GROUP BY ke.entity_id                                                   -- Group the results by entity_id to avoid duplicate entries
        ORDER BY ke.entity_id DESC                                              -- Order the results by entity_id in descending order
        LIMIT ?                                                                 -- Limit the number of results returned by the query
    
    */

}





// Export all relevat functions
module.exports = {
    getUser,
    createUser,
    addEntityToDatabase,
    updateEntityInDatabase,
    getEntity,
    getEntities,
    getEntitiesForMultipleLocations,
    getStateEntities,
    getCountryEntities,
    getUserCreatedEntities,
    getMostUsedTags,
    getUserData,
    setUserLocation,
    updateUserBadge,
    getAllImagesFromEntities,
    attachAddInfoToEntities,
    getReviewsFromEntities,
    changeProfileImage,
    saveOrUpdateVote,
    deleteEntityToTable,
    addReviewToDatabase
} 