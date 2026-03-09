import httpx
import os
from typing import Optional, Dict, Any

TWITCH_CLIENT_ID = os.getenv("TWITCH_CLIENT_ID")
TWITCH_APP_ACCESS_TOKEN = os.getenv("TWITCH_APP_ACCESS_TOKEN")

async def get_twitch_streams(usernames: list[str]) -> Optional[Dict[str, Any]]:
    if not TWITCH_CLIENT_ID or not TWITCH_APP_ACCESS_TOKEN or not usernames:
        return None

    async with httpx.AsyncClient() as client:
        headers = {
            "Client-ID": TWITCH_CLIENT_ID,
            "Authorization": f"Bearer {TWITCH_APP_ACCESS_TOKEN}"
        }
        # Build query params for multiple users
        params = [("user_login", username) for username in usernames]
        
        try:
            response = await client.get("https://api.twitch.tv/helix/streams", headers=headers, params=params)
            response.raise_for_status()
            data = response.json().get("data", [])
            
            # Remap the data to be keyed by user_login for easy lookup
            return {stream['user_login'].lower(): stream for stream in data}
        except httpx.HTTPStatusError as e:
            print(f"Error fetching Twitch streams: {e}")
            # Potentially handle token refresh logic here if you get a 401
            return None
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            return None

def format_stream_data(stream_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Formats the raw stream data from Twitch API into a more usable structure.
    """
    if not stream_data:
        return {
            "is_live": False,
        }
    
    thumbnail_url = stream_data.get("thumbnail_url", "").replace("{width}", "440").replace("{height}", "248")

    return {
        "is_live": True,
        "game_name": stream_data.get("game_name"),
        "stream_title": stream_data.get("title"),
        "viewer_count": stream_data.get("viewer_count"),
        "thumbnail_url": thumbnail_url,
        "started_at": stream_data.get("started_at"),
    }
