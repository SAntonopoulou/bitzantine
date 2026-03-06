from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from database import get_session
from models import Post, User
from auth import get_current_active_user

router = APIRouter(
    prefix="/posts",
    tags=["posts"],
)

@router.get("/", response_model=List[Post])
def get_posts(session: Session = Depends(get_session)):
    posts = session.exec(select(Post)).all()
    return posts

@router.post("/", response_model=Post)
def create_post(post: Post, session: Session = Depends(get_session), current_user: User = Depends(get_current_active_user)):
    post.author_id = current_user.id
    session.add(post)
    session.commit()
    session.refresh(post)
    return post
