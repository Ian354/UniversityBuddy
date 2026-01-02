import requests
import json
import sys

BASE_URL = "http://localhost:4000"

# Sample data for 20 users
USERS_DATA = [
    {"email": "student1@uni54.edu", "name": "Alice Johnson", "role": "STUDENT", "degree": "Computer Science"},
    {"email": "student2@uni54.edu", "name": "Bob Smith", "role": "STUDENT", "degree": "Engineering"},
    {"email": "student3@uni54.edu", "name": "Carol Williams", "role": "STUDENT", "degree": "Business"},
    {"email": "student4@uni54.edu", "name": "David Brown", "role": "STUDENT", "degree": "Mathematics"},
    {"email": "student5@uni54.edu", "name": "Emma Davis", "role": "STUDENT", "degree": "Physics"},
    {"email": "student6@uni54.edu", "name": "Frank Miller", "role": "STUDENT", "degree": "Chemistry"},
    {"email": "student7@uni54.edu", "name": "Grace Wilson", "role": "STUDENT", "degree": "Biology"},
    {"email": "student8@uni54.edu", "name": "Henry Moore", "role": "STUDENT", "degree": "Literature"},
    {"email": "student9@uni54.edu", "name": "Ivy Taylor", "role": "STUDENT", "degree": "History"},
    {"email": "student10@uni54.edu", "name": "Jack Anderson", "role": "STUDENT", "degree": "Art"},
    {"email": "student11@uni54.edu", "name": "Kate Thomas", "role": "MENTOR", "degree": "Psychology"},
    {"email": "student12@uni54.edu", "name": "Liam Jackson", "role": "STUDENT", "degree": "Economics"},
    {"email": "student13@uni54.edu", "name": "Mia White", "role": "STUDENT", "degree": "Sociology"},
    {"email": "student14@uni54.edu", "name": "Noah Harris", "role": "STUDENT", "degree": "Architecture"},
    {"email": "student15@uni54.edu", "name": "Olivia Martin", "role": "STUDENT", "degree": "Music"},
    {"email": "student16@uni54.edu", "name": "Paul Thompson", "role": "MENTOR", "degree": "Medicine"},
    {"email": "student17@uni54.edu", "name": "Quinn Garcia", "role": "STUDENT", "degree": "Law"},
    {"email": "student18@uni54.edu", "name": "Rachel Martinez", "role": "STUDENT", "degree": "Pharmacy"},
    {"email": "student19@uni54.edu", "name": "Sam Robinson", "role": "STUDENT", "degree": "Environmental Science"},
    {"email": "student20@uni54.edu", "name": "Tina Clark", "role": "STUDENT", "degree": "Political Science"},
]

# Sample forum topics
FORUM_TOPICS = [
    {"title": "Best study spots on campus?", "category": "Academics", "content": "Where do you all like to study? Looking for quiet places."},
    {"title": "Recommendations for accommodation", "category": "Accommodation", "content": "I'm new here. Any good places to live near campus?"},
    {"title": "Sports and activities", "category": "Activities", "content": "What sports clubs are available? I'd love to join one."},
    {"title": "Tips for new students", "category": "General", "content": "What advice would you give to someone just starting?"},
    {"title": "Public transport tips", "category": "Student Life", "content": "How do you get around the city? Any tips on transport passes?"},
]

# Sample forum posts (responses to existing topics)
FORUM_RESPONSES = [
    "Great question! I'd love to know too.",
    "Thanks for sharing this information!",
    "I completely agree with this.",
    "This is really helpful, thank you!",
    "Has anyone else experienced this?",
    "I can help with this if you need more info.",
    "This is exactly what I was looking for!",
]


def create_user(user_data, university_id):
    """Create a user via the /auth/register API endpoint"""
    url = f"{BASE_URL}/auth/register"
    
    data = {
        "email": user_data["email"],
        "name": user_data["name"],
        "password": "password123",  # Default password for all users
        "role": user_data["role"],
        "university": str(university_id),  # Register endpoint expects string
        "degree": user_data.get("degree"),
        "openToContact": True
    }
    
    try:
        response = requests.post(url, json=data)
        if response.status_code == 201:
            result = response.json()
            user = result.get("user")
            token = result.get("token")
            print(f"✅ Created user: {user['name']} (ID: {user['id']})")
            return user, token
        else:
            print(f"❌ Failed to create user {user_data['name']}: {response.status_code} - {response.text}")
            return None, None
    except Exception as e:
        print(f"❌ Error creating user {user_data['name']}: {e}")
        return None, None


def login_user(email, password):
    """Login user and get JWT token"""
    url = f"{BASE_URL}/auth/login"
    
    data = {
        "email": email,
        "password": password
    }
    
    try:
        response = requests.post(url, json=data)
        if response.status_code == 200:
            result = response.json()
            token = result.get("token")
            print(f"✅ Logged in: {email}")
            return token
        else:
            print(f"❌ Failed to login {email}: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error logging in {email}: {e}")
        return None


def create_forum_topic(university_id, token, topic_data):
    """Create a forum topic for the university"""
    url = f"{BASE_URL}/forum/university/{university_id}/topics"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    data = {
        "title": topic_data["title"],
        "category": topic_data["category"],
        "initialPost": topic_data["content"]
    }
    
    try:
        response = requests.post(url, json=data, headers=headers)
        if response.status_code == 201:
            topic = response.json()
            print(f"  ✅ Created topic: {topic['title']} (ID: {topic['id']})")
            return topic
        else:
            print(f"  ❌ Failed to create topic: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"  ❌ Error creating topic: {e}")
        return None


def create_forum_post(topic_id, token, content):
    """Create a post in a forum topic"""
    url = f"{BASE_URL}/forum/topic/{topic_id}/posts"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    data = {
        "content": content
    }
    
    try:
        response = requests.post(url, json=data, headers=headers)
        if response.status_code == 201:
            print(f"  ✅ Created post in topic {topic_id}")
            return response.json()
        else:
            print(f"  ❌ Failed to create post: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"  ❌ Error creating post: {e}")
        return None


def get_existing_topics(university_id):
    """Get existing forum topics for the university"""
    url = f"{BASE_URL}/forum/university/{university_id}/topics"
    
    try:
        response = requests.get(url)
        if response.status_code == 200:
            topics = response.json()
            print(f"📋 Found {len(topics)} existing topics for university {university_id}")
            return topics
        else:
            print(f"❌ Failed to get topics: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Error getting topics: {e}")
        return []


def main():
    university_id = 54
    
    print(f"🚀 Starting script to add 20 users to university {university_id}")
    print("=" * 60)
    
    # Track created users and their tokens
    created_users = []
    
    # Step 1: Create users
    print("\n📝 Step 1: Creating 20 users...")
    for user_data in USERS_DATA:
        user, token = create_user(user_data, university_id)
        if user and token:
            created_users.append({
                "user": user,
                "email": user_data["email"],
                "token": token
            })
    
    print(f"\n✅ Successfully created {len(created_users)} users")
    
    if len(created_users) == 0:
        print("❌ No users were created. Exiting.")
        sys.exit(1)
    
    # Step 2: Have some users create forum topics
    print("\n📝 Step 2: Creating forum topics...")
    created_topic_ids = []
    
    # First 5 users create topics
    for i, user_info in enumerate(created_users[:5]):
        if i < len(FORUM_TOPICS):
            topic = create_forum_topic(
                university_id,
                user_info["token"],
                FORUM_TOPICS[i]
            )
            if topic:
                created_topic_ids.append(topic["id"])
    
    # Step 3: Get all existing topics (including ones we just created)
    print("\n📝 Step 3: Getting all topics for university...")
    all_topics = get_existing_topics(university_id)
    
    if len(all_topics) == 0:
        print("⚠️  No topics found. Users created but no forum participation.")
        return
    
    # Step 4: Have remaining users participate in discussions
    print("\n📝 Step 4: Users participating in forum discussions...")
    
    # Each user posts in 1-3 random topics
    import random
    for user_info in created_users:
        num_posts = random.randint(1, min(3, len(all_topics)))
        selected_topics = random.sample(all_topics, num_posts)
        
        for topic in selected_topics:
            response_text = random.choice(FORUM_RESPONSES)
            create_forum_post(topic["id"], user_info["token"], response_text)
    
    print("\n" + "=" * 60)
    print("✅ Script completed successfully!")
    print(f"📊 Summary:")
    print(f"   - Created {len(created_users)} users")
    print(f"   - Created {len(created_topic_ids)} new topics")
    print(f"   - Users participated in existing discussions")


if __name__ == "__main__":
    main()