// server.js - Express Node.js Server for Donor Junction Hub Backend
const http = require('http');
const url = require('url');
const querystring = require('querystring');
const mysql = require('mysql2/promise');

const PORT = process.env.PORT || 8000;
const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';
const DB_NAME = process.env.DB_NAME || 'donor_junction';

let pool = null;

async function getDbPool() {
  if (!pool) {
    try {
      pool = mysql.createPool({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASS,
        database: DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
    } catch (e) {
      console.warn('MySQL Connection failed, using in-memory mock storage:', e.message);
      pool = null;
    }
  }
  return pool;
}

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname.replace(/^\/(backend|backend-full)\//, '/');
  const query = parsedUrl.query;

  let bodyData = {};
  if (req.method === 'POST' || req.method === 'PUT') {
    const buffers = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }
    const rawBody = Buffer.concat(buffers).toString();
    try {
      bodyData = JSON.parse(rawBody);
    } catch (e) {
      bodyData = querystring.parse(rawBody);
    }
  }

  const db = await getDbPool();

  try {
    if (pathname === '/hub_login.php' || pathname === '/hub_login') {
      const mobile = (bodyData.mobile || '').trim();
      if (!mobile) return sendJson(res, { status: 'error', message: 'Mobile is required' });

      if (db) {
        const [rows] = await db.query('SELECT * FROM organizations WHERE mobile = ? LIMIT 1', [mobile]);
        if (rows.length > 0) {
          const org = rows[0];
          return sendJson(res, {
            status: 'success',
            exists: true,
            org_status: org.status,
            otp: '1234'
          });
        }
      }
      return sendJson(res, { status: 'success', exists: true, org_status: 'approved', otp: '1234' });
    }

    if (pathname === '/register_organization.php' || pathname === '/register_organization') {
      const mobile = (bodyData.mobile || '').trim();
      const name = (bodyData.name || '').trim();
      if (!mobile || !name) return sendJson(res, { status: 'error', message: 'Mobile and Name required' });

      if (db) {
        await db.query(
          `INSERT INTO organizations (org_id, name, category, license, mobile, city, address, pincode, status, doc_uri, doc_type, doc_name)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
           ON DUPLICATE KEY UPDATE name=VALUES(name), category=VALUES(category), license=VALUES(license), city=VALUES(city), address=VALUES(address), status='pending'`,
          [
            bodyData.id || mobile,
            name,
            bodyData.category || 'Hospital',
            bodyData.license || '',
            mobile,
            bodyData.city || '',
            bodyData.address || '',
            bodyData.pincode || null,
            bodyData.doc_uri || null,
            bodyData.doc_type || null,
            bodyData.doc_name || null
          ]
        );
      }
      return sendJson(res, { status: 'success', message: 'Organization registered successfully' });
    }

    if (pathname === '/get_profile.php' || pathname === '/get_profile') {
      const mobile = (query.mobile || '').trim();
      if (db && mobile) {
        const [rows] = await db.query('SELECT * FROM organizations WHERE mobile = ? LIMIT 1', [mobile]);
        if (rows.length > 0) {
          const org = rows[0];
          return sendJson(res, {
            status: 'success',
            organization: {
              id: String(org.id),
              org_id: org.org_id,
              name: org.name,
              category: org.category,
              license: org.license,
              mobile: org.mobile,
              city: org.city,
              address: org.address,
              status: org.status
            }
          });
        }
      }
      return sendJson(res, {
        status: 'success',
        organization: {
          id: '1',
          name: 'Apollo Speciality Hospital',
          category: 'Hospital',
          license: 'TN-MED-2024-00872',
          mobile: mobile || '9840012345',
          city: 'Madurai',
          address: 'KK Nagar, Madurai',
          status: 'approved'
        }
      });
    }

    if (pathname === '/save_profile.php' || pathname === '/save_profile') {
      const mobile = (bodyData.mobile || '').trim();
      const name = (bodyData.name || '').trim();
      const city = (bodyData.city || '').trim();

      if (db && mobile) {
        await db.query('UPDATE organizations SET name = ?, city = ? WHERE mobile = ?', [name, city, mobile]);
      }
      return sendJson(res, { status: 'success', message: 'Profile updated successfully' });
    }

    if (pathname === '/get_pending_organizations.php' || pathname === '/get_pending_organizations') {
      if (db) {
        const [rows] = await db.query("SELECT * FROM organizations WHERE status = 'pending' ORDER BY created_at DESC");
        return sendJson(res, { status: 'success', organizations: rows });
      }
      return sendJson(res, {
        status: 'success',
        organizations: [
          {
            id: '101',
            name: 'Rotary LifeCare NGO',
            category: 'NGO',
            license: 'NGO-TN-2023-991',
            mobile: '9123456789',
            city: 'Madurai',
            address: 'Anna Nagar Community Center, Madurai',
            status: 'pending'
          }
        ]
      });
    }

    if (pathname === '/get_active_admins.php' || pathname === '/get_active_admins') {
      if (db) {
        const [rows] = await db.query("SELECT * FROM organizations WHERE status = 'approved' ORDER BY created_at DESC");
        const admins = rows.map(r => ({
          id: String(r.id),
          adminName: r.admin_name || 'Chief Medical Officer',
          orgName: r.name,
          email: r.email || `${r.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@hospital.in`,
          phone: `+91 ${r.mobile}`,
          status: 'Active',
          joinedDate: 'Approved'
        }));
        return sendJson(res, { status: 'success', admins });
      }
      return sendJson(res, {
        status: 'success',
        admins: [
          {
            id: '1',
            adminName: 'Chief Medical Officer',
            orgName: 'Apollo Speciality Hospital',
            email: 'apollo.madurai@hospital.in',
            phone: '+91 9840012345',
            status: 'Active',
            joinedDate: 'Approved'
          }
        ]
      });
    }

    if (pathname === '/approve_organization.php' || pathname === '/approve_organization') {
      const id = (bodyData.id || '').trim();
      const status = bodyData.status || 'approved';
      if (db && id) {
        await db.query('UPDATE organizations SET status = ? WHERE id = ? OR org_id = ? OR mobile = ?', [status, id, id, id]);
      }
      return sendJson(res, { status: 'success', message: `Organization updated to ${status}` });
    }

    if (pathname === '/create_campaign.php' || pathname === '/create_campaign') {
      if (db) {
        const [result] = await db.query(
          `INSERT INTO campaigns (org_mobile, title, organization, place, date_time, status, status_color, status_bg, description, collected, target, image_uri)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            bodyData.org_mobile || '',
            bodyData.title || '',
            'Donor Junction Hub',
            bodyData.place || '',
            bodyData.date_time || '',
            bodyData.status || 'Active',
            bodyData.status_color || '#27500A',
            bodyData.status_bg || '#eaf3de',
            bodyData.description || '',
            bodyData.collected || 0,
            bodyData.target || 50,
            bodyData.image_uri || null
          ]
        );
        return sendJson(res, { status: 'success', message: 'Campaign created', id: String(result.insertId) });
      }
      return sendJson(res, { status: 'success', message: 'Campaign created', id: String(Date.now()) });
    }

    if (pathname === '/get_campaigns.php' || pathname === '/get_campaigns') {
      if (db) {
        const [rows] = await db.query('SELECT * FROM campaigns ORDER BY created_at DESC');
        const campaigns = rows.map(r => ({
          id: String(r.id),
          title: r.title,
          date: r.date_time || `${r.date} ${r.time}`,
          place: r.place || r.location,
          status: r.status || 'Active',
          statusColor: r.status_color || '#27500A',
          statusBg: r.status_bg || '#eaf3de',
          description: r.description || '',
          collected: r.collected || 0,
          target: r.target || 50,
          imageUri: r.image_uri || r.image_url
        }));
        return sendJson(res, { status: 'success', campaigns });
      }
      return sendJson(res, {
        status: 'success',
        campaigns: [
          {
            id: '1',
            title: 'World Blood Day 2026',
            date: 'June 14 • 09:00 AM - 05:00 PM',
            place: 'Apollo Hospital Main Auditorium',
            status: 'Active',
            statusColor: '#27500A',
            statusBg: '#eaf3de',
            description: 'All blood groups • Target 50 donors',
            collected: 32,
            target: 50,
            imageUri: null
          }
        ]
      });
    }

    if (pathname === '/get_posts.php' || pathname === '/get_posts') {
      if (db) {
        const [rows] = await db.query('SELECT * FROM posts ORDER BY created_at DESC');
        const data = rows.map(r => ({
          id: String(r.id),
          title: r.patient_name,
          mobile: r.mobile,
          location: `${r.hospital}, ${r.city}`,
          city: r.city,
          blood_group: r.blood_group,
          units_needed: `${r.units} units`,
          type: r.urgency === 'Critical' || r.urgency === 'Urgent' ? 'urgent' : 'normal',
          description: r.note || `Needs ${r.blood_group}`
        }));
        return sendJson(res, { status: 'success', data });
      }
      return sendJson(res, {
        status: 'success',
        data: [
          {
            id: '1',
            title: 'Muruganathan S',
            mobile: '9876500001',
            location: 'Madurai Medical College Hospital (GRH), Madurai',
            city: 'Madurai',
            blood_group: 'O+',
            units_needed: '2 units',
            type: 'urgent',
            description: 'Emergency surgery in Trauma Ward'
          }
        ]
      });
    }

    if (pathname === '/get_chats.php' || pathname === '/get_chats') {
      return sendJson(res, {
        status: 'success',
        chats: [
          {
            id: '1',
            name: 'Ravi Kumar',
            initials: 'RK',
            lastMessage: 'I am available for donation tomorrow at 10 AM.',
            time: '10:42 AM',
            unread: 1,
            avatarBg: '#ffeaea',
            avatarColor: '#A32D2D',
            donor: { id: '1', name: 'Ravi Kumar', initials: 'RK', bloodGroup: 'A+', distance: '2.3 km', status: 'Eligible' }
          }
        ]
      });
    }

    if (pathname === '/get_messages.php' || pathname === '/get_messages') {
      return sendJson(res, {
        status: 'success',
        messages: [
          { id: '1', text: 'Hello! We saw your blood donation inquiry.', me: true },
          { id: '2', text: 'Yes, I am willing to donate blood tomorrow morning at 10 AM.', me: false }
        ]
      });
    }

    if (pathname === '/send_message.php' || pathname === '/send_message') {
      return sendJson(res, { status: 'success', message: 'Message sent' });
    }

    // Default 404 response
    res.statusCode = 404;
    return sendJson(res, { status: 'error', message: 'Endpoint not found' });
  } catch (err) {
    console.error('Server error:', err);
    res.statusCode = 500;
    return sendJson(res, { status: 'error', message: err.message });
  }
});

function sendJson(res, obj) {
  res.end(JSON.stringify(obj));
}

server.listen(PORT, () => {
  console.log(`Donor Junction Hub Server listening on http://localhost:${PORT}`);
});
